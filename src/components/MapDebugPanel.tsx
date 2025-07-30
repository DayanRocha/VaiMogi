import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { routeTrackingService } from '@/services/routeTrackingService';

export const MapDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugData, setDebugData] = useState<any>({});
  
  const { 
    hasActiveRoute, 
    activeRoute, 
    driverLocation, 
    nextDestination, 
    isLoading 
  } = useRouteTracking();

  useEffect(() => {
    const updateDebugData = () => {
      const activeRouteData = localStorage.getItem('activeRoute');
      const studentsData = localStorage.getItem('students');
      const driverData = localStorage.getItem('driverData');
      const guardianData = localStorage.getItem('guardianData');

      setDebugData({
        localStorage: {
          activeRoute: activeRouteData ? JSON.parse(activeRouteData) : null,
          students: studentsData ? JSON.parse(studentsData) : null,
          driver: driverData ? JSON.parse(driverData) : null,
          guardian: guardianData ? JSON.parse(guardianData) : null
        },
        hook: {
          hasActiveRoute,
          activeRoute,
          driverLocation,
          nextDestination,
          isLoading
        },
        timestamp: new Date().toLocaleTimeString()
      });
    };

    updateDebugData();
    const interval = setInterval(updateDebugData, 2000); // Atualizar a cada 2 segundos

    return () => clearInterval(interval);
  }, [hasActiveRoute, activeRoute, driverLocation, nextDestination, isLoading]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="secondary"
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          🔍 Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] overflow-hidden">
      <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
        <span className="text-sm font-semibold">🔍 Debug Panel</span>
        <Button
          onClick={() => setIsVisible(false)}
          size="sm"
          variant="ghost"
          className="text-white hover:bg-gray-700 h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>
      
      <div className="p-3 overflow-y-auto max-h-80 text-xs">
        <div className="mb-3">
          <div className="font-semibold text-gray-700 mb-1">📊 Status Atual</div>
          <div className="space-y-1">
            <div className={`flex justify-between ${isLoading ? 'text-yellow-600' : 'text-gray-600'}`}>
              <span>Loading:</span>
              <span>{isLoading ? '⏳ SIM' : '✅ NÃO'}</span>
            </div>
            <div className={`flex justify-between ${hasActiveRoute ? 'text-green-600' : 'text-red-600'}`}>
              <span>Rota Ativa:</span>
              <span>{hasActiveRoute ? '✅ SIM' : '❌ NÃO'}</span>
            </div>
            <div className={`flex justify-between ${driverLocation ? 'text-green-600' : 'text-gray-600'}`}>
              <span>Localização:</span>
              <span>{driverLocation ? '📍 SIM' : '❌ NÃO'}</span>
            </div>
            <div className={`flex justify-between ${nextDestination ? 'text-blue-600' : 'text-gray-600'}`}>
              <span>Próximo Destino:</span>
              <span>{nextDestination ? '🎯 SIM' : '❌ NÃO'}</span>
            </div>
          </div>
        </div>

        {activeRoute && (
          <div className="mb-3">
            <div className="font-semibold text-gray-700 mb-1">🗺️ Dados da Rota</div>
            <div className="bg-gray-50 p-2 rounded text-xs">
              <div><strong>ID:</strong> {activeRoute.id}</div>
              <div><strong>Motorista:</strong> {activeRoute.driverName}</div>
              <div><strong>Direção:</strong> {activeRoute.direction}</div>
              <div><strong>Estudantes:</strong> {activeRoute.studentPickups?.length || 0}</div>
              <div><strong>Ativa:</strong> {activeRoute.isActive ? '✅' : '❌'}</div>
            </div>
          </div>
        )}

        {driverLocation && (
          <div className="mb-3">
            <div className="font-semibold text-gray-700 mb-1">📍 Localização</div>
            <div className="bg-blue-50 p-2 rounded text-xs">
              <div><strong>Lat:</strong> {driverLocation.lat.toFixed(6)}</div>
              <div><strong>Lng:</strong> {driverLocation.lng.toFixed(6)}</div>
              <div><strong>Hora:</strong> {new Date(driverLocation.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        )}

        {nextDestination && (
          <div className="mb-3">
            <div className="font-semibold text-gray-700 mb-1">🎯 Próximo Destino</div>
            <div className="bg-orange-50 p-2 rounded text-xs">
              <div><strong>Nome:</strong> {nextDestination.studentName}</div>
              <div><strong>Status:</strong> {nextDestination.status}</div>
              <div><strong>Endereço:</strong> {nextDestination.address}</div>
            </div>
          </div>
        )}

        <div className="mb-3">
          <div className="font-semibold text-gray-700 mb-1">💾 localStorage</div>
          <div className="space-y-1">
            <div className={`flex justify-between ${debugData.localStorage?.activeRoute ? 'text-green-600' : 'text-red-600'}`}>
              <span>activeRoute:</span>
              <span>{debugData.localStorage?.activeRoute ? '✅' : '❌'}</span>
            </div>
            <div className={`flex justify-between ${debugData.localStorage?.students ? 'text-green-600' : 'text-red-600'}`}>
              <span>students:</span>
              <span>{debugData.localStorage?.students ? `✅ (${debugData.localStorage.students.length})` : '❌'}</span>
            </div>
            <div className={`flex justify-between ${debugData.localStorage?.driver ? 'text-green-600' : 'text-red-600'}`}>
              <span>driver:</span>
              <span>{debugData.localStorage?.driver ? '✅' : '❌'}</span>
            </div>
            <div className={`flex justify-between ${debugData.localStorage?.guardian ? 'text-green-600' : 'text-red-600'}`}>
              <span>guardian:</span>
              <span>{debugData.localStorage?.guardian ? '✅' : '❌'}</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center border-t pt-2">
          Atualizado: {debugData.timestamp}
        </div>
      </div>

      <div className="border-t p-2 bg-gray-50">
        <div className="flex gap-1">
          <Button
            onClick={() => {
              console.log('🔍 Debug completo:', debugData);
              alert('Dados enviados para o console (F12)');
            }}
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
          >
            📋 Console
          </Button>
          <Button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            size="sm"
            variant="destructive"
            className="flex-1 text-xs"
          >
            🗑️ Reset
          </Button>
        </div>
      </div>
    </div>
  );
};