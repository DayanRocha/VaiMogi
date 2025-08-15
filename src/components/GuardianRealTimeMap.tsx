import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useGuardianTracking } from '@/hooks/useRealTimeTracking';
import { MapPin, Clock, Route, AlertCircle, AlertTriangle } from 'lucide-react';
import RouteDeviationAlert from './RouteDeviationAlert';
import RouteDeviationSettings from './RouteDeviationSettings';
import { useRouteDeviationAlert } from '@/hooks/useRouteDeviationAlert';

interface GuardianRealTimeMapProps {
  guardianId: string;
  mapboxToken: string;
  className?: string;
}

export const GuardianRealTimeMap = ({ 
  guardianId, 
  mapboxToken, 
  className = '' 
}: GuardianRealTimeMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const routePointMarkers = useRef<mapboxgl.Marker[]>([]);
  const routeSource = useRef<string>('route-source');
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [navigationMode, setNavigationMode] = useState(false);
  const [followDriver, setFollowDriver] = useState(true);
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showDeviationSettings, setShowDeviationSettings] = useState(false);
  
  const routeInfo = useGuardianTracking(guardianId);
  const [navigationRoute, setNavigationRoute] = useState<any>(null);
  
  // Hook para gerenciar alertas de desvio de rota
  const {
    isAlertVisible,
    deviationState,
    isRecalculating,
    showAlert,
    hideAlert,
    forceRecalculation
  } = useRouteDeviationAlert({
    autoShow: true,
    autoHide: false, // Não ocultar automaticamente para dar controle ao responsável
    alertThreshold: 1, // Mostrar alerta no primeiro desvio
    enableToastNotifications: true,
    onDeviationDetected: (state) => {
      console.log('🚨 Desvio detectado:', state);
      // Focar no motorista quando houver desvio
      if (followDriver && map.current && lastPosition) {
        map.current.flyTo({
          center: [lastPosition.lng, lastPosition.lat],
          zoom: 16,
          duration: 1000
        });
      }
    },
    onRouteRecalculated: (success) => {
      console.log(success ? '✅ Rota recalculada' : '❌ Falha no recálculo');
    },
    onBackOnRoute: () => {
      console.log('✅ Motorista voltou à rota');
      hideAlert();
    }
  });

  // Função para atualizar indicadores de status em tempo real
  const updateStatusIndicators = async () => {
    try {
      const { realTimeTrackingService } = await import('@/services/realTimeTrackingService');
      const locationStatus = realTimeTrackingService.getLocationStatus();
      const qualityStats = realTimeTrackingService.getLocationQualityStats();
      const activeRoute = realTimeTrackingService.getActiveTrackingRoute();
      
      const speedElement = document.getElementById('speed-indicator');
      const accuracyElement = document.getElementById('accuracy-indicator');
      const lastUpdateElement = document.getElementById('last-update-indicator');
      const trailElement = document.getElementById('trail-indicator');
      
      if (speedElement && activeRoute?.currentSpeed !== undefined) {
        const speedKmh = (activeRoute.currentSpeed * 3.6).toFixed(1);
        const isMoving = activeRoute.currentSpeed > 0.5;
        speedElement.textContent = `${speedKmh} km/h ${isMoving ? '🟢' : '🟡'}`;
        speedElement.style.color = isMoving ? '#10B981' : '#F59E0B';
      }
      
      if (accuracyElement && locationStatus.accuracy) {
        const accuracy = `${locationStatus.accuracy.toFixed(0)}m`;
        const qualityIcon = locationStatus.quality === 'high' ? '🟢' : 
                           locationStatus.quality === 'medium' ? '🟡' : '🔴';
        const qualityText = locationStatus.quality === 'high' ? 'Alta' : 
                           locationStatus.quality === 'medium' ? 'Média' : 'Baixa';
        accuracyElement.textContent = `${accuracy} ${qualityIcon} ${qualityText}`;
        accuracyElement.style.color = locationStatus.quality === 'high' ? '#10B981' : 
                                     locationStatus.quality === 'medium' ? '#F59E0B' : '#EF4444';
      }

      if (lastUpdateElement && locationStatus.timeSinceUpdate !== undefined) {
        const timeDiff = locationStatus.timeSinceUpdate;
        const isRecent = timeDiff < 10;
        lastUpdateElement.textContent = `${timeDiff}s atrás ${isRecent ? '🟢' : '🟡'}`;
        lastUpdateElement.style.color = isRecent ? '#10B981' : '#F59E0B';
      }
      
      if (trailElement && activeRoute?.locationHistory) {
        const trailDistance = calculateTrailDistance(activeRoute.locationHistory);
        trailElement.textContent = `${trailDistance} percorrido`;
        trailElement.style.color = '#3B82F6';
      }

      // Atualizar indicador de estatísticas de qualidade
      const qualityStatsElement = document.getElementById('quality-stats-indicator');
      if (qualityStatsElement && qualityStats.totalUpdates > 0) {
        const avgAccuracy = qualityStats.averageAccuracy || 0;
        const qualityPercentage = qualityStats.highQualityPercentage;
        const qualityIcon = qualityPercentage > 70 ? '🟢' : qualityPercentage > 40 ? '🟡' : '🔴';
        qualityStatsElement.textContent = `Média ${avgAccuracy}m ${qualityIcon} ${qualityPercentage}%`;
        qualityStatsElement.style.color = qualityPercentage > 70 ? '#10B981' : 
                                         qualityPercentage > 40 ? '#F59E0B' : '#EF4444';
      }
    } catch (error) {
      console.warn('Erro ao atualizar indicadores:', error);
    }
  };

  // Função para agrupar estudantes pelo mesmo endereço
  const groupStudentsByAddress = (routePoints: any[]) => {
    const addressGroups: { [address: string]: any[] } = {};
    
    routePoints.forEach(point => {
      if (point.type === 'student') {
        const address = point.address || 'Endereço não informado';
        if (!addressGroups[address]) {
          addressGroups[address] = [];
        }
        addressGroups[address].push({
          id: point.studentId,
          name: point.studentName,
          schoolName: point.schoolName,
          address: point.address,
          lat: point.lat,
          lng: point.lng
        });
      }
    });
    
    return addressGroups;
  };

  // Função para calcular distância do rastro
  const calculateTrailDistance = (locationHistory: any[]) => {
    if (!locationHistory || locationHistory.length < 2) return '0km';
    
    let totalDistance = 0;
    for (let i = 1; i < locationHistory.length; i++) {
      const prev = locationHistory[i - 1];
      const curr = locationHistory[i];
      
      // Simple distance calculation using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
      const dLon = (curr.lng - prev.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    return totalDistance < 1 ? `${Math.round(totalDistance * 1000)}m` : `${totalDistance.toFixed(1)}km`;
  };

  // Função para mostrar modal com estudantes do mesmo endereço
  const showStudentsAtAddress = (address: string, students: any[]) => {
    const studentsHtml = students.map(student => `
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        margin: 4px 0;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 3px solid #3B82F6;
      ">
        <div style="
          width: 24px;
          height: 24px;
          background: #3B82F6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        ">${student.name.charAt(0)}</div>
        <div>
          <div style="font-weight: bold; color: #333; font-size: 14px;">${student.name}</div>
          ${student.schoolName ? `<div style="font-size: 12px; color: #666;">${student.schoolName}</div>` : ''}
        </div>
      </div>
    `).join('');
    
    const modalContent = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      " onclick="this.remove()">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 20px;
          max-width: 400px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        " onclick="event.stopPropagation()">
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #eee;
          ">
            <h3 style="
              margin: 0;
              color: #333;
              font-size: 18px;
              font-weight: bold;
            ">👥 Estudantes neste endereço</h3>
            <button onclick="this.closest('.modal-overlay').remove()" style="
              background: none;
              border: none;
              font-size: 20px;
              cursor: pointer;
              color: #666;
              padding: 4px;
            ">×</button>
          </div>
          
          <div style="
            margin-bottom: 16px;
            padding: 12px;
            background: #f0f9ff;
            border-radius: 8px;
            border-left: 4px solid #3B82F6;
          ">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">📍 Endereço:</div>
            <div style="font-weight: 500; color: #333;">${address}</div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="
              font-size: 14px;
              color: #666;
              margin-bottom: 8px;
              font-weight: 500;
            ">Estudantes (${students.length}):</div>
            ${studentsHtml}
          </div>
          
          <div style="text-align: center;">
            <button onclick="this.closest('.modal-overlay').remove()" style="
              background: #3B82F6;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
            ">Fechar</button>
          </div>
        </div>
      </div>
    `;
    
    // Remover modal existente se houver
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Criar e adicionar novo modal
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal-overlay';
    modalDiv.innerHTML = modalContent;
    document.body.appendChild(modalDiv);
  };

  // Função para criar marcador de ponto da rota
  const createRoutePointMarker = (point: any, index: number, allRoutePoints: any[] = []) => {
    const isStudent = point.type === 'student';
    const isSchool = point.type === 'school';
    const isMixed = point.type === 'mixed';
    
    const markerElement = document.createElement('div');
    markerElement.className = 'route-point-marker';
    
    if (isStudent) {
      markerElement.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: #3B82F6;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          cursor: pointer;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      `;
    } else if (isSchool) {
      markerElement.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: #10B981;
          border: 2px solid white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          cursor: pointer;
        ">
          <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
          </svg>
        </div>
      `;
    } else if (isMixed) {
      // Marcador especial para múltiplos estudantes no mesmo endereço
      const studentCount = point.students?.length || 0;
      markerElement.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: #8B5CF6;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
          cursor: pointer;
          position: relative;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v-3c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v3h3v4H4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM7.5 11.5C8.33 11.5 9 10.83 9 10s-.67-1.5-1.5-1.5S6 9.17 6 10s.67 1.5 1.5 1.5z"/>
          </svg>
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            background: #EF4444;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
          ">${studentCount}</div>
        </div>
      `;
    }

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([point.lng, point.lat]);

    // Adicionar event listener de clique para estudantes
    if (isStudent) {
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Agrupar estudantes por endereço
        const addressGroups = groupStudentsByAddress(allRoutePoints);
        const studentsAtAddress = addressGroups[point.address] || [];
        
        // Se há mais de um estudante no mesmo endereço, mostrar modal
        if (studentsAtAddress.length > 1) {
          showStudentsAtAddress(point.address, studentsAtAddress);
        } else {
          // Se há apenas um estudante, mostrar popup normal
          const popup = marker.getPopup();
          if (popup) {
            popup.addTo(map.current!);
          }
        }
      });
    }

    // Adicionar popup com informações
    let popupContent = '';
    
    if (isStudent) {
      popupContent = `
        <div style="padding: 8px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 8px; height: 8px; background: #3B82F6; border-radius: 50%;"></div>
            <strong style="color: #3B82F6;">👤 ${point.studentName}</strong>
          </div>
          <div style="font-size: 12px; color: #666;">
            📍 ${point.address}
          </div>
        </div>
      `;
    } else if (isSchool) {
      popupContent = `
        <div style="padding: 8px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%;"></div>
            <strong style="color: #10B981;">🏫 ${point.schoolName}</strong>
          </div>
          <div style="font-size: 12px; color: #666;">
            📍 ${point.address}
          </div>
        </div>
      `;
    } else if (isMixed && point.students) {
      // Popup para múltiplos estudantes
      const studentsHtml = point.students.map((student: any) => `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
          <div style="width: 6px; height: 6px; background: #8B5CF6; border-radius: 50%;"></div>
          <span style="font-size: 12px; color: #333;">${student.name}</span>
          ${student.schoolName ? `<span style="font-size: 10px; color: #666; margin-left: 4px;">(${student.schoolName})</span>` : ''}
        </div>
      `).join('');
      
      const schoolsHtml = point.schools && point.schools.length > 0 ? `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #eee;">
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Escolas:</div>
          ${point.schools.map((school: any) => `
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
              <div style="width: 6px; height: 6px; background: #10B981; border-radius: 50%;"></div>
              <span style="font-size: 11px; color: #10B981;">🏫 ${school.name}</span>
            </div>
          `).join('')}
        </div>
      ` : '';
      
      popupContent = `
        <div style="padding: 8px; max-width: 250px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <div style="width: 8px; height: 8px; background: #8B5CF6; border-radius: 50%;"></div>
            <strong style="color: #8B5CF6;">👥 ${point.students.length} Estudantes</strong>
          </div>
          ${studentsHtml}
          ${schoolsHtml}
          <div style="font-size: 12px; color: #666; margin-top: 6px; padding-top: 4px; border-top: 1px solid #eee;">
            📍 ${point.address}
          </div>
        </div>
      `;
    }
    
    if (popupContent) {
      marker.setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(popupContent)
      );
    }

    return marker;
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-46.6333, -23.5505], // São Paulo como centro padrão
        zoom: 12,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserLocation: true
      }));

      map.current.on('load', () => {
        console.log('🗺️ Mapa do responsável carregado');
        setMapLoaded(true);
        setMapError(null);
        
        // Adicionar fonte para a rota
        if (map.current) {
          map.current.addSource(routeSource.current, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            }
          });

          // Adicionar camada da rota principal
          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: routeSource.current,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#FF8C00',
              'line-width': 6,
              'line-opacity': 0.8
            }
          });

          // Adicionar camada de sombra da rota (para efeito visual)
          map.current.addLayer({
            id: 'route-line-shadow',
            type: 'line',
            source: routeSource.current,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#000000',
              'line-width': 8,
              'line-opacity': 0.3
            }
          }, 'route-line');
        }
      });

      map.current.on('error', (e) => {
        console.error('❌ Erro no mapa do responsável:', e);
        setMapError('Erro ao carregar o mapa');
      });

    } catch (error) {
      console.error('❌ Erro ao inicializar mapa do responsável:', error);
      setMapError('Erro ao inicializar o mapa');
    }

    return () => {
      if (driverMarker.current) {
        driverMarker.current.remove();
      }
      // Remover marcadores dos pontos da rota
      routePointMarkers.current.forEach(marker => marker.remove());
      routePointMarkers.current = [];
      
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken]);

  // Ativar modo de navegação automaticamente quando rota iniciar
  useEffect(() => {
    if (routeInfo.hasActiveRoute && !navigationMode) {
      console.log('🧭 Ativando modo de navegação automaticamente');
      setNavigationMode(true);
      setFollowDriver(true);
    } else if (!routeInfo.hasActiveRoute && navigationMode) {
      console.log('🛑 Desativando modo de navegação - rota encerrada');
      setNavigationMode(false);
      setFollowDriver(false);
    }
  }, [routeInfo.hasActiveRoute, navigationMode]);

  // Atualizar indicadores de status periodicamente
  useEffect(() => {
    if (!routeInfo.hasActiveRoute) return;

    const interval = setInterval(() => {
      updateStatusIndicators();
    }, 2000); // Atualizar a cada 2 segundos

    // Atualização inicial
    updateStatusIndicators();

    return () => clearInterval(interval);
  }, [routeInfo.hasActiveRoute]);

  // Calcular rota de navegação em tempo real
  const calculateNavigationRoute = async () => {
    if (!routeInfo.hasActiveRoute || !routeInfo.driverLocation) {
      return null;
    }

    try {
      const { realTimeTrackingService } = await import('@/services/realTimeTrackingService');
      const route = realTimeTrackingService.getActiveTrackingRoute();
      
      if (!route || !route.currentLocation) {
        return null;
      }

      // Encontrar o estudante do responsável
      const studentPoint = route.routePoints.find(point => 
        point.type === 'student' || point.type === 'mixed'
      );
      
      // Encontrar todas as escolas
      const schoolPoints = route.routePoints.filter(point => 
        point.type === 'school'
      );

      if (!studentPoint || schoolPoints.length === 0) {
        console.warn('⚠️ Não foi possível encontrar pontos da rota para o responsável:', guardianId);
        return null;
      }

      // Construir waypoints baseado na direção da rota
      let waypoints;
      if (route.direction === 'to_home') {
        // Desembarque em casa: motorista -> escolas -> estudantes (ordem inversa)
        waypoints = [
          [route.currentLocation.lng, route.currentLocation.lat],
          ...schoolPoints.map(school => [school.lng, school.lat]),
          [studentPoint.lng, studentPoint.lat]
        ];
        console.log('🏠 Rota para casa: motorista -> escolas -> estudantes');
      } else {
        // Embarque para escola: motorista -> estudantes -> escolas
        waypoints = [
          [route.currentLocation.lng, route.currentLocation.lat],
          [studentPoint.lng, studentPoint.lat],
          ...schoolPoints.map(school => [school.lng, school.lat])
        ];
        console.log('🚌 Rota para escola: motorista -> estudantes -> escolas');
      }

      // Fazer requisição para a API do Mapbox Directions
      const waypointsStr = waypoints.map(wp => `${wp[0]},${wp[1]}`).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypointsStr}?geometries=geojson&access_token=${mapboxToken}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        console.log('🗺️ Rota de navegação calculada para o responsável:', guardianId);
        return data.routes[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao calcular rota de navegação:', error);
      return null;
    }
  };

  // Atualizar posição do motorista e rota
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (routeInfo.hasActiveRoute && routeInfo.driverLocation) {
      const { lat, lng } = routeInfo.driverLocation;

      // Remover cálculo de rotação - não mais necessário

      // Atualizar ou criar marcador do motorista
      if (driverMarker.current) {
        driverMarker.current.setLngLat([lng, lat]);
      } else {
        // Criar marcador com ícone de carro para o motorista (ícone maior e mais bonito)
        const markerElement = document.createElement('div');
        markerElement.className = 'mapboxgl-marker-driver';
        markerElement.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 11L6.5 6.5H17.5L19 11M5 11V16H19V11M5 11H19M7 16V18H9V16M15 16V18H17V16" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="white" fill-opacity="0.9"/>
              <circle cx="8" cy="17" r="1" fill="white"/>
              <circle cx="16" cy="17" r="1" fill="white"/>
            </svg>
          </div>
        `;

        // Criar popup com nome do motorista
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false
        }).setHTML(`
          <div style="padding: 8px; text-align: center;">
            <strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M5 11L6.5 6.5H17.5L19 11M5 11V16H19V11M5 11H19M7 16V18H9V16M15 16V18H17V16" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="#3b82f6" fill-opacity="0.8"/></svg> ${routeInfo.driverName || 'Motorista'}</strong>
          </div>
        `);

        driverMarker.current = new mapboxgl.Marker(markerElement)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current);
      }

      // Salvar posição atual para próximo cálculo de rotação
      setLastPosition({ lat, lng });

      // Calcular e atualizar rota de navegação em tempo real
      if (navigationMode) {
        calculateNavigationRoute().then(navRoute => {
          if (navRoute && navRoute.geometry) {
            setNavigationRoute(navRoute);
            
            // Atualizar rota no mapa com a rota de navegação
            if (map.current && map.current.getSource(routeSource.current)) {
              const source = map.current.getSource(routeSource.current) as mapboxgl.GeoJSONSource;
              source.setData({
                type: 'Feature',
                properties: {},
                geometry: navRoute.geometry
              });
              
              console.log('🧭 Rota de navegação atualizada no mapa do responsável');
            }
          }
        });
      }

      // Atualizar indicadores de status
      updateStatusIndicators();

      // Modo de navegação: seguir motorista automaticamente
      if (navigationMode && followDriver) {
        map.current.easeTo({
          center: [lng, lat],
          zoom: 16, // Zoom mais próximo para navegação
          duration: 1500,
          essential: true // Não pode ser interrompido por interação do usuário
        });
      }

      console.log('📍 Posição do motorista atualizada no mapa do responsável:', {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        navigationMode,
        followDriver
      });
    } else {
      // Remover marcador se não há rota ativa
      if (driverMarker.current) {
        driverMarker.current.remove();
        driverMarker.current = null;
      }
    }

    // Atualizar rota no mapa (modo normal)
    if (!navigationMode && routeInfo.hasActiveRoute && routeInfo.routeGeometry && map.current.getSource(routeSource.current)) {
      const source = map.current.getSource(routeSource.current) as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: routeInfo.routeGeometry
      });

      console.log('🛣️ Rota atualizada no mapa do responsável (modo normal)');
    } else if (!routeInfo.hasActiveRoute && map.current.getSource(routeSource.current)) {
      // Limpar rota se não há rota ativa
      const source = map.current.getSource(routeSource.current) as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
      setNavigationRoute(null);
    }
  }, [routeInfo, mapLoaded, navigationMode, followDriver, guardianId, mapboxToken]);

  // Gerenciar marcadores dos pontos da rota
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remover marcadores existentes
    routePointMarkers.current.forEach(marker => marker.remove());
    routePointMarkers.current = [];

    // Adicionar novos marcadores se há rota ativa
    if (routeInfo.hasActiveRoute) {
      // Obter pontos da rota do serviço de rastreamento
      import('@/services/realTimeTrackingService').then(({ realTimeTrackingService }) => {
        const activeRoute = realTimeTrackingService.getActiveTrackingRoute();
        
        if (activeRoute && activeRoute.routePoints) {
          activeRoute.routePoints.forEach((point, index) => {
            const marker = createRoutePointMarker(point, index, activeRoute.routePoints);
            marker.addTo(map.current!);
            routePointMarkers.current.push(marker);
          });

          console.log('📍 Marcadores dos pontos da rota adicionados:', {
            totalPoints: activeRoute.routePoints.length,
            studentPoints: activeRoute.routePoints.filter(p => p.type === 'student').length,
            schoolPoints: activeRoute.routePoints.filter(p => p.type === 'school').length
          });
        }
      }).catch(error => {
        console.warn('⚠️ Erro ao carregar pontos da rota:', error);
      });
    }
  }, [routeInfo.hasActiveRoute, mapLoaded]);

  // Adicionar CSS para animações dos marcadores
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .mapboxgl-marker-arrow {
        cursor: pointer;
      }
      
      .route-point-marker {
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      
      .route-point-marker:hover {
        transform: scale(1.1);
      }
      
      @keyframes navigationPulse {
        0% {
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.5);
        }
        50% {
          box-shadow: 0 6px 16px rgba(255, 140, 0, 0.7);
        }
        100% {
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.5);
        }
      }
      
      .arrow-container {
        transition: transform 0.3s ease !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Erro ao carregar o mapa</p>
          <p className="text-sm text-gray-500">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Container do mapa */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      />

      {/* Controles minimalistas no canto superior direito */}
      {routeInfo.hasActiveRoute && (
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Botão de configurações de desvio de rota */}
          <button
            onClick={() => setShowDeviationSettings(true)}
            className="w-10 h-10 bg-white text-red-500 hover:bg-red-50 rounded-full shadow-lg transition-colors flex items-center justify-center"
            title="Configurações de Desvio de Rota"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>





          
          {navigationMode ? (
            <>
              <button
                onClick={() => setFollowDriver(!followDriver)}
                className={`w-10 h-10 rounded-full shadow-lg transition-colors ${
                  followDriver 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-orange-500 hover:bg-orange-50'
                }`}
                title={followDriver ? 'Parar de seguir' : 'Seguir motorista'}
              >
                📍
              </button>
              <button
                onClick={() => setNavigationMode(false)}
                className="w-10 h-10 bg-white text-gray-600 hover:bg-gray-50 rounded-full shadow-lg transition-colors"
                title="Sair do modo navegação"
              >
                ❌
              </button>
            </>
          ) : (
            <button
              onClick={() => setNavigationMode(true)}
              className="w-10 h-10 bg-orange-500 text-white hover:bg-orange-600 rounded-full shadow-lg transition-colors"
              title="Ativar modo navegação"
            >
              🧭
            </button>
          )}
        </div>
      )}

      {/* Indicador de carregamento */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Mensagem quando não há rota ativa */}
      {mapLoaded && !routeInfo.hasActiveRoute && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="bg-white rounded-lg p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Aguardando Rota</p>
            <p className="text-sm text-gray-500">O mapa entrará automaticamente no modo de navegação quando o motorista iniciar uma rota</p>
          </div>
        </div>
      )}

      {/* Alerta de Desvio de Rota */}
      <RouteDeviationAlert
        isVisible={isAlertVisible}
        onDismiss={hideAlert}
        onViewMap={() => {
          // Focar no motorista no mapa
          if (map.current && lastPosition) {
            map.current.flyTo({
              center: [lastPosition.lng, lastPosition.lat],
              zoom: 16,
              duration: 1000
            });
          }
          // Ativar modo navegação se não estiver ativo
          if (!navigationMode) {
            setNavigationMode(true);
          }
          // Seguir motorista
          setFollowDriver(true);
        }}
      />

      {/* Modal de Configurações de Desvio de Rota */}
      <RouteDeviationSettings
        isOpen={showDeviationSettings}
        onClose={() => setShowDeviationSettings(false)}
      />


    </div>
  );
};

export default GuardianRealTimeMap;
