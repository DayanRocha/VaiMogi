import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, TestTube, MapPin, Clock } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const {
    isEnabled: notificationsEnabled,
    hasPermission: permissionGranted,
    proximityThreshold,
    isLoading,
    error,
    requestPermission,
    toggleNotifications,
    setProximityThreshold: updateProximityThreshold,
    testNotification,
    clearCache,
    refreshState
  } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      refreshState();
      setTestResult(null);
    }
  }, [isOpen, refreshState]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    
    if (granted) {
      setTestResult('✅ Permissão concedida! Notificações habilitadas.');
    } else {
      setTestResult('❌ Permissão negada. Verifique as configurações do navegador.');
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    toggleNotifications(enabled);
    
    if (enabled && !permissionGranted) {
      handleRequestPermission();
    }
  };

  const handleThresholdChange = (value: number) => {
    updateProximityThreshold(value);
  };

  const handleTestNotification = async () => {
    setTestResult(null);
    
    const success = await testNotification();
    if (success) {
      setTestResult('✅ Notificação de teste enviada com sucesso!');
    } else {
      setTestResult(error || '❌ Falha ao enviar notificação de teste.');
    }
  };

  const handleClearCache = () => {
    clearCache();
    setTestResult('🧹 Cache de notificações limpo. Novas notificações podem ser enviadas.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-800">
              Configurações de Notificação
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Status das Notificações
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Permissão do Navegador:</span>
                <span className={`font-medium ${permissionGranted ? 'text-green-600' : 'text-red-600'}`}>
                  {permissionGranted ? '✅ Concedida' : '❌ Negada'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Notificações da Rota:</span>
                <span className={`font-medium ${notificationsEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                  {notificationsEnabled ? '🔔 Habilitadas' : '🔕 Desabilitadas'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-green-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-800">Notificações de Proximidade</p>
                  <p className="text-sm text-gray-600">
                    Receber alertas quando o motorista estiver chegando
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => handleToggleNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {!permissionGranted && (
              <button
                onClick={handleRequestPermission}
                disabled={isLoading}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Solicitando...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Permitir Notificações
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h3 className="font-medium text-gray-800">Distância de Alerta</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Notificar quando o motorista estiver a:</span>
                <span className="font-medium text-orange-600">{proximityThreshold}m</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={proximityThreshold}
                onChange={(e) => handleThresholdChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>100m</span>
                <span>550m</span>
                <span>1000m</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleTestNotification}
              disabled={isLoading || !permissionGranted}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  Testar Notificação
                </>
              )}
            </button>

            <button
              onClick={handleClearCache}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Limpar Cache de Notificações
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${
              testResult.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : testResult.includes('🧹')
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult}
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <h4 className="font-medium mb-2">💡 Como funciona:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Você receberá uma notificação quando o motorista estiver próximo</li>
              <li>• A distância pode ser ajustada de 100m a 1000m</li>
              <li>• Notificações são enviadas apenas uma vez por estudante</li>
              <li>• Use "Limpar Cache" para permitir novas notificações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;