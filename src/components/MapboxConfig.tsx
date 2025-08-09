import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { realTimeTrackingService } from '@/services/realTimeTrackingService';
import { MapPin, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface MapboxConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenSaved?: (token: string) => void;
}

export const MapboxConfig = ({ open, onOpenChange, onTokenSaved }: MapboxConfigProps) => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Carregar token salvo
  useEffect(() => {
    const savedToken = localStorage.getItem('mapboxAccessToken');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Validar token do Mapbox
  const validateToken = async (tokenToValidate: string): Promise<boolean> => {
    if (!tokenToValidate.startsWith('pk.')) {
      setValidationError('Token deve começar com "pk."');
      return false;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${tokenToValidate}&limit=1`
      );

      if (response.ok) {
        setValidationError(null);
        return true;
      } else if (response.status === 401) {
        setValidationError('Token inválido ou expirado');
        return false;
      } else {
        setValidationError('Erro ao validar token');
        return false;
      }
    } catch (error) {
      setValidationError('Erro de conexão ao validar token');
      return false;
    }
  };

  // Salvar token
  const handleSaveToken = async () => {
    if (!token.trim()) {
      setValidationError('Token é obrigatório');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    const isValid = await validateToken(token.trim());

    if (isValid) {
      // Salvar no localStorage
      localStorage.setItem('mapboxAccessToken', token.trim());
      
      // Configurar no serviço de rastreamento
      realTimeTrackingService.setMapboxToken(token.trim());
      
      // Notificar componente pai
      onTokenSaved?.(token.trim());
      
      console.log('✅ Token do Mapbox configurado com sucesso');
      onOpenChange(false);
    }

    setIsValidating(false);
  };

  // Remover token
  const handleRemoveToken = () => {
    if (confirm('Deseja remover o token do Mapbox? As funcionalidades de mapa serão limitadas.')) {
      localStorage.removeItem('mapboxAccessToken');
      setToken('');
      realTimeTrackingService.setMapboxToken('');
      console.log('🗑️ Token do Mapbox removido');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Configurar Mapbox
          </DialogTitle>
          <DialogDescription>
            Configure seu token de acesso do Mapbox para habilitar funcionalidades de mapa e rastreamento em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campo do token */}
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Token de Acesso</Label>
            <div className="relative">
              <Input
                id="mapbox-token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-800 mb-1">Como obter um token:</p>
            <ol className="text-blue-700 space-y-1 list-decimal list-inside">
              <li>Acesse <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">mapbox.com <ExternalLink className="w-3 h-3" /></a></li>
              <li>Faça login ou crie uma conta gratuita</li>
              <li>Vá para "Access tokens"</li>
              <li>Copie o token público (começa com "pk.")</li>
            </ol>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveToken}
              disabled={isValidating || !token.trim()}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isValidating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Validando...
                </div>
              ) : (
                'Salvar Token'
              )}
            </Button>
            
            {token && (
              <Button
                onClick={handleRemoveToken}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Remover
              </Button>
            )}
          </div>

          {/* Status */}
          {token && !validationError && !isValidating && (
            <div className="bg-green-50 rounded-lg p-3 text-sm">
              <p className="text-green-800">
                ✅ Token configurado. Funcionalidades de mapa habilitadas.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};