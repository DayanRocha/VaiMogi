import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MobileDebugPanelProps {
  onSimulateRouteStart: () => void;
  onSimulateRouteStop: () => void;
  isRouteActive: boolean;
}

export const MobileDebugPanel: React.FC<MobileDebugPanelProps> = ({
  onSimulateRouteStart,
  onSimulateRouteStop,
  isRouteActive
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {/* Botão para mostrar/esconder o painel */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full z-50 text-xs"
      >
        🐛
      </button>

      {/* Painel de debug */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-black/90 text-white p-4 rounded-lg z-50 min-w-[200px]">
          <h3 className="text-sm font-bold mb-2">🔧 Debug Mobile</h3>
          
          <div className="space-y-2">
            <div className="text-xs">
              Status: {isRouteActive ? '🟢 Rota Ativa' : '🔴 Sem Rota'}
            </div>
            
            <div className="text-xs">
              Largura: {window.innerWidth}px
            </div>
            
            <div className="text-xs">
              Mobile: {window.innerWidth < 768 ? 'Sim' : 'Não'}
            </div>
            
            <div className="space-y-1">
              <Button
                onClick={onSimulateRouteStart}
                disabled={isRouteActive}
                className="w-full text-xs h-8"
                variant="default"
              >
                🚌 Iniciar Rota
              </Button>
              
              <Button
                onClick={onSimulateRouteStop}
                disabled={!isRouteActive}
                className="w-full text-xs h-8"
                variant="destructive"
              >
                ⏹️ Parar Rota
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};