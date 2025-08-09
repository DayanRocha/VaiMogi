import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { realTimeTrackingService } from '@/services/realTimeTrackingService';
import { Navigation, Settings, MapPin } from 'lucide-react';

interface NavigationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NavigationSettings = ({ open, onOpenChange }: NavigationSettingsProps) => {
  const [autoNavigationEnabled, setAutoNavigationEnabled] = useState(true);

  // Carregar configuração atual
  useEffect(() => {
    const isEnabled = realTimeTrackingService.isAutoNavigationEnabled();
    setAutoNavigationEnabled(isEnabled);
  }, []);

  // Salvar configuração
  const handleToggleAutoNavigation = (enabled: boolean) => {
    setAutoNavigationEnabled(enabled);
    realTimeTrackingService.setAutoNavigationEnabled(enabled);
    
    console.log('🧭 Configuração de navegação automática alterada:', enabled);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            Configurações de Navegação
          </DialogTitle>
          <DialogDescription>
            Configure como o sistema deve se comportar ao iniciar uma rota.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Navegação Automática */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-navigation" className="text-base font-medium">
                  Navegação Automática
                </Label>
                <p className="text-sm text-gray-500">
                  Abrir app de navegação automaticamente ao iniciar rota
                </p>
              </div>
              <Switch
                id="auto-navigation"
                checked={autoNavigationEnabled}
                onCheckedChange={handleToggleAutoNavigation}
              />
            </div>

            {/* Explicação detalhada */}
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-blue-800">
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Quando habilitado, ao clicar "Iniciar Rota" o sistema abrirá automaticamente um app de navegação</li>
                    <li>• Você poderá escolher entre Google Maps, Waze ou Apple Maps</li>
                    <li>• A rota será calculada com todos os pontos de parada</li>
                    <li>• O rastreamento em tempo real continuará funcionando normalmente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Status atual */}
            <div className={`rounded-lg p-3 text-sm ${
              autoNavigationEnabled 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  autoNavigationEnabled ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className={`font-medium ${
                  autoNavigationEnabled ? 'text-green-800' : 'text-gray-600'
                }`}>
                  {autoNavigationEnabled 
                    ? 'Navegação automática ativada' 
                    : 'Navegação automática desativada'
                  }
                </span>
              </div>
              <p className={`mt-1 ${
                autoNavigationEnabled ? 'text-green-700' : 'text-gray-500'
              }`}>
                {autoNavigationEnabled 
                  ? 'O sistema abrirá automaticamente o app de navegação ao iniciar uma rota'
                  : 'Você precisará abrir manualmente o app de navegação'
                }
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Salvar Configurações
            </Button>
          </div>

          {/* Dica adicional */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <div className="flex items-start gap-2">
              <Settings className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-yellow-800">
                <p className="font-medium mb-1">💡 Dica:</p>
                <p className="text-yellow-700">
                  Mesmo com a navegação automática desabilitada, você ainda pode usar o botão de mapa (🗺️) 
                  ao lado de cada aluno para abrir a navegação manualmente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};