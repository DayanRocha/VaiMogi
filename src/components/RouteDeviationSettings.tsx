import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, AlertTriangle, Info, Clock, MapPin } from 'lucide-react';
import { realTimeTrackingService } from '@/services/realTimeTrackingService';
import { useNotificationToasts } from '@/hooks/useNotificationToasts';

interface RouteDeviationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DeviationSettings {
  offRouteThreshold: number;
  minRecalculationInterval: number;
  autoRecalculation: boolean;
  notificationsEnabled: boolean;
  alertThreshold: number;
  maxRecalculationAttempts: number;
}

const DEFAULT_SETTINGS: DeviationSettings = {
  offRouteThreshold: 100, // metros
  minRecalculationInterval: 30, // segundos
  autoRecalculation: true,
  notificationsEnabled: true,
  alertThreshold: 1, // número de desvios antes do alerta
  maxRecalculationAttempts: 3
};

export const RouteDeviationSettings: React.FC<RouteDeviationSettingsProps> = ({
  isOpen,
  onClose
}) => {
  const { addToast } = useNotificationToasts();
  const [settings, setSettings] = useState<DeviationSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<DeviationSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar configurações atuais
  useEffect(() => {
    if (isOpen) {
      const currentSettings: DeviationSettings = {
        offRouteThreshold: realTimeTrackingService.getOffRouteThreshold(),
        minRecalculationInterval: realTimeTrackingService.getMinRecalculationInterval(),
        autoRecalculation: true, // Assumir que está sempre ativo
        notificationsEnabled: true, // Verificar se notificações estão ativas
        alertThreshold: 1,
        maxRecalculationAttempts: 3
      };
      
      setSettings(currentSettings);
      setOriginalSettings(currentSettings);
      setHasChanges(false);
    }
  }, [isOpen]);

  // Verificar se há mudanças
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const handleSettingChange = (key: keyof DeviationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Aplicar configurações no serviço
      realTimeTrackingService.setOffRouteThreshold(settings.offRouteThreshold);
      realTimeTrackingService.setMinRecalculationInterval(settings.minRecalculationInterval);
      
      // Salvar no localStorage para persistência
      localStorage.setItem('routeDeviationSettings', JSON.stringify(settings));
      
      setOriginalSettings(settings);
      setHasChanges(false);
      
      addToast({
        type: 'success',
        title: '✅ Configurações Salvas',
        message: 'As configurações de detecção de desvio foram atualizadas',
        duration: 3000
      });
      
      console.log('✅ Configurações de desvio salvas:', settings);
      
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      
      addToast({
        type: 'error',
        title: '❌ Erro ao Salvar',
        message: 'Não foi possível salvar as configurações',
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Configurações de Desvio</h2>
            </div>
            <button
              onClick={handleCancel}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-6">
          {/* Threshold de Distância */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              Distância para Desvio (metros)
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              step="10"
              value={settings.offRouteThreshold}
              onChange={(e) => handleSettingChange('offRouteThreshold', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Distância mínima da rota para considerar um desvio
            </p>
          </div>

          {/* Intervalo de Recálculo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              Intervalo de Recálculo (segundos)
            </label>
            <input
              type="number"
              min="10"
              max="300"
              step="5"
              value={settings.minRecalculationInterval}
              onChange={(e) => handleSettingChange('minRecalculationInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tempo mínimo entre recálculos automáticos da rota
            </p>
          </div>

          {/* Threshold de Alerta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Alertas após (desvios)
            </label>
            <select
              value={settings.alertThreshold}
              onChange={(e) => handleSettingChange('alertThreshold', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1º desvio (imediato)</option>
              <option value={2}>2º desvio</option>
              <option value={3}>3º desvio</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Número de desvios antes de mostrar alerta visual
            </p>
          </div>

          {/* Máximo de Tentativas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Recálculos
            </label>
            <select
              value={settings.maxRecalculationAttempts}
              onChange={(e) => handleSettingChange('maxRecalculationAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 tentativa</option>
              <option value={2}>2 tentativas</option>
              <option value={3}>3 tentativas</option>
              <option value={5}>5 tentativas</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Número máximo de tentativas de recálculo por desvio
            </p>
          </div>

          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Recálculo Automático</label>
                <p className="text-xs text-gray-500">Recalcular rota automaticamente ao detectar desvio</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRecalculation}
                  onChange={(e) => handleSettingChange('autoRecalculation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Notificações</label>
                <p className="text-xs text-gray-500">Enviar notificações sobre desvios de rota</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Informações */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Como funciona:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>O sistema monitora a posição do motorista a cada 2 segundos</li>
                  <li>Calcula a distância da rota usando algoritmo Haversine</li>
                  <li>Recalcula automaticamente usando Mapbox Directions API</li>
                  <li>Notifica responsáveis sobre mudanças na rota</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 rounded-b-lg flex justify-between items-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Padrão
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDeviationSettings;