import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Navigation, AlertCircle, RefreshCw, MapPin } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';
import { MAPBOX_CONFIG, isMapboxConfigured } from '@/config/maps';

// Importar CSS do Mapbox
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
  activeRoute: ActiveRoute;
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

export const MapboxMap: React.FC<MapboxMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverMarker, setDriverMarker] = useState<mapboxgl.Marker | null>(null);
  const [studentMarkers, setStudentMarkers] = useState<mapboxgl.Marker[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  // Validar se os dados necessários estão disponíveis antes de inicializar
  const canInitializeMap = () => {
    if (!activeRoute || !driverLocation) {
      console.log('❌ Dados insuficientes para inicializar mapa:', {
        activeRoute: !!activeRoute,
        driverLocation: !!driverLocation,
        hasValidCoords: driverLocation ? !isNaN(driverLocation.lat) && !isNaN(driverLocation.lng) : false
      });
      return false;
    }

    if (!isMapboxConfigured()) {
      console.log('❌ Mapbox não configurado adequadamente');
      return false;
    }

    // Verificar se as coordenadas são válidas
    if (isNaN(driverLocation.lat) || isNaN(driverLocation.lng)) {
      console.log('❌ Coordenadas inválidas:', driverLocation);
      return false;
    }

    return true;
  };

  // Função para inicializar o mapa apenas quando necessário
  const initializeMap = async () => {
    if (!mapContainer.current || map.current || !canInitializeMap()) {
      return;
    }

    setInitializationAttempted(true);

    try {
      console.log('🗺️ Inicializando Mapbox com dados válidos...');
      
      // Configurar token
      mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

      // Centro na localização do motorista
      const center: [number, number] = [driverLocation!.lng, driverLocation!.lat];
      
      console.log('📍 Centro do mapa:', center);
      console.log('🚐 Motorista:', activeRoute.driverName);

      // Criar instância do mapa
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current!,
        style: MAPBOX_CONFIG.style,
        center: center,
        zoom: MAPBOX_CONFIG.defaultZoom,
        attributionControl: true
      });

      console.log('🗺️ Instância do mapa criada');

      // Timeout de segurança
      const loadTimeout = setTimeout(() => {
        if (isLoading) {
          console.error('⏰ Timeout ao carregar mapa');
          setError('Timeout no carregamento. Verifique sua conexão de internet.');
          setIsLoading(false);
        }
      }, 15000);

      // Aguardar carregamento
      mapInstance.on('load', () => {
        console.log('✅ Mapa carregado com sucesso!');
        clearTimeout(loadTimeout);
        setIsLoading(false);
        setError(null);
        setRetryCount(0);
      });

      // Tratar erros específicos
      mapInstance.on('error', (e) => {
        console.error('❌ Erro no mapa:', e);
        clearTimeout(loadTimeout);
        const errorMsg = e.error?.message || 'Erro de rede ou configuração';
        setError(`Erro no mapa: ${errorMsg}`);
        setIsLoading(false);
      });

      // Adicionar controles
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-left');
      mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current = mapInstance;
      console.log('🗺️ Mapa configurado completamente');

    } catch (err: any) {
      console.error('❌ Erro ao inicializar mapa:', err);
      setError(`Falha na inicialização: ${err.message}`);
      setIsLoading(false);
      setInitializationAttempted(true);
    }
  };

  // Inicializar mapa apenas quando os dados estão disponíveis
  useEffect(() => {
    if (canInitializeMap() && !initializationAttempted) {
      initializeMap();
    }

    return () => {
      if (map.current) {
        console.log('🧹 Limpando mapa...');
        map.current.remove();
        map.current = null;
      }
    };
  }, [activeRoute, driverLocation, retryCount, initializationAttempted]);

  // Função para tentar novamente
  const handleRetry = () => {
    console.log('🔄 Tentando recarregar mapa...');
    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    setInitializationAttempted(false);
    
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  };

  // Atualizar marcador do motorista
  useEffect(() => {
    if (!map.current || !driverLocation) return;

    console.log('📍 Atualizando localização do motorista:', driverLocation);

    // Remover marcador anterior
    if (driverMarker) {
      driverMarker.remove();
    }

    // Criar elemento do motorista
    const driverElement = document.createElement('div');
    driverElement.innerHTML = `
      <div style="
        width: 40px; 
        height: 40px; 
        background: #3B82F6; 
        border: 3px solid white; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 20px;
        cursor: pointer;
      ">🚐</div>
    `;

    // Criar marcador
    const marker = new mapboxgl.Marker(driverElement)
      .setLngLat([driverLocation.lng, driverLocation.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937;">${activeRoute.driverName}</h3>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Atualizado: ${new Date(driverLocation.timestamp).toLocaleTimeString()}
              </p>
            </div>
          `)
      )
      .addTo(map.current);

    setDriverMarker(marker);

    // Centralizar no motorista
    map.current.flyTo({
      center: [driverLocation.lng, driverLocation.lat],
      zoom: 15,
      duration: 1000
    });

  }, [driverLocation, activeRoute.driverName]);

  // Atualizar marcadores dos estudantes
  useEffect(() => {
    if (!map.current || !activeRoute.studentPickups) return;

    console.log('👥 Atualizando marcadores dos estudantes:', activeRoute.studentPickups.length);

    // Remover marcadores anteriores
    studentMarkers.forEach(marker => marker.remove());

    const newMarkers: mapboxgl.Marker[] = [];

    activeRoute.studentPickups.forEach((student, index) => {
      if (!student.lat || !student.lng) return;

      const isNext = nextDestination?.studentId === student.studentId;
      const color = student.status === 'pending' ? (isNext ? '#F59E0B' : '#EF4444') :
                   student.status === 'picked_up' ? '#3B82F6' : '#10B981';

      const studentElement = document.createElement('div');
      studentElement.innerHTML = `
        <div style="
          width: 32px; 
          height: 32px; 
          background: ${color}; 
          border: 2px solid white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          color: white;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        ">${index + 1}</div>
      `;

      const statusText = student.status === 'pending' ? 'Aguardando' :
                        student.status === 'picked_up' ? 'Na Van' : 'Entregue';

      const marker = new mapboxgl.Marker(studentElement)
        .setLngLat([student.lng, student.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937;">${student.studentName}</h3>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">${student.address}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px;">
                  Status: <span style="color: ${color}; font-weight: bold;">${statusText}</span>
                </p>
                ${isNext ? '<p style="margin: 4px 0 0 0; font-size: 12px; color: #F59E0B; font-weight: bold;">📍 Próximo destino</p>' : ''}
              </div>
            `)
        )
        .addTo(map.current);

      newMarkers.push(marker);
    });

    setStudentMarkers(newMarkers);
  }, [activeRoute.studentPickups, nextDestination]);

  // Se não pode inicializar, mostrar aviso
  if (!canInitializeMap() && !isLoading && !error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600 max-w-md mx-auto p-4">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Aguardando Dados</h3>
          <p className="text-sm mb-4">Esperando localização válida do motorista para exibir o mapa</p>
          
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-left">
            <p><strong>Rota ativa:</strong> {activeRoute ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Localização:</strong> {driverLocation ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Token Mapbox:</strong> {isMapboxConfigured() ? '✅ Sim' : '❌ Não'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600 max-w-md mx-auto p-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro no Mapa</h3>
          <p className="text-sm mb-4">{error}</p>
          
          <div className="bg-red-50 p-3 rounded-lg text-xs text-left mb-4">
            <p className="font-semibold mb-2">Informações de Debug:</p>
            <p><strong>Token configurado:</strong> {isMapboxConfigured() ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Rota ativa:</strong> {activeRoute ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Localização:</strong> {driverLocation ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Tentativas:</strong> {retryCount + 1}</p>
          </div>
          
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold mb-2">Carregando Mapa</p>
          <p className="text-sm text-gray-500 mb-4">Inicializando visualização em tempo real...</p>
          
          <div className="bg-blue-50 p-3 rounded-lg text-xs max-w-xs mx-auto">
            <p><strong>Motorista:</strong> {activeRoute.driverName}</p>
            <p><strong>Estudantes:</strong> {activeRoute.studentPickups?.length || 0}</p>
            <p><strong>Status:</strong> Carregando mapa...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Legenda */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs z-10">
        <h4 className="font-semibold text-sm mb-2">Legenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">🚐</div>
            <span>Motorista</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full text-white text-xs flex items-center justify-center font-bold">1</div>
            <span>Próximo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">2</div>
            <span>Aguardando</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full text-white text-xs flex items-center justify-center font-bold">✓</div>
            <span>Concluído</span>
          </div>
        </div>
      </div>

      {/* Info da rota */}
      {nextDestination && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm">Próximo: {nextDestination.studentName}</span>
          </div>
          <p className="text-xs text-gray-600">{nextDestination.address}</p>
        </div>
      )}
    </div>
  );
};
