import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '@/services/pushNotificationService';
import { realTimeTrackingService } from '@/services/realTimeTrackingService';

interface NotificationState {
  isEnabled: boolean;
  hasPermission: boolean;
  proximityThreshold: number;
  isLoading: boolean;
  error: string | null;
}

interface UseNotificationsReturn extends NotificationState {
  requestPermission: () => Promise<boolean>;
  toggleNotifications: (enabled: boolean) => void;
  setProximityThreshold: (threshold: number) => void;
  testNotification: () => Promise<boolean>;
  clearCache: () => void;
  refreshState: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [state, setState] = useState<NotificationState>({
    isEnabled: true,
    hasPermission: false,
    proximityThreshold: 500,
    isLoading: false,
    error: null
  });

  // Carregar estado inicial
  const loadState = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEnabled: realTimeTrackingService.areNotificationsEnabled(),
      hasPermission: pushNotificationService.isEnabled(),
      proximityThreshold: realTimeTrackingService.getProximityThreshold()
    }));
  }, []);

  // Carregar estado na inicialização
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Solicitar permissão
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const granted = await realTimeTrackingService.requestNotificationPermission();
      
      setState(prev => ({
        ...prev,
        hasPermission: granted,
        isLoading: false,
        error: granted ? null : 'Permissão negada pelo usuário'
      }));
      
      return granted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  // Alternar notificações
  const toggleNotifications = useCallback((enabled: boolean) => {
    realTimeTrackingService.setNotificationsEnabled(enabled);
    setState(prev => ({ ...prev, isEnabled: enabled }));
    
    // Se habilitando e não tem permissão, solicitar
    if (enabled && !state.hasPermission) {
      requestPermission();
    }
  }, [state.hasPermission, requestPermission]);

  // Configurar threshold de proximidade
  const setProximityThreshold = useCallback((threshold: number) => {
    realTimeTrackingService.setProximityThreshold(threshold);
    setState(prev => ({ ...prev, proximityThreshold: threshold }));
  }, []);

  // Testar notificação
  const testNotification = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const success = await realTimeTrackingService.testNotification();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: success ? null : 'Falha ao enviar notificação de teste'
      }));
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao testar notificação';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  // Limpar cache
  const clearCache = useCallback(() => {
    realTimeTrackingService.clearProximityNotifications();
    pushNotificationService.clearSentNotifications();
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Atualizar estado
  const refreshState = useCallback(() => {
    loadState();
    setState(prev => ({ ...prev, error: null }));
  }, [loadState]);

  return {
    ...state,
    requestPermission,
    toggleNotifications,
    setProximityThreshold,
    testNotification,
    clearCache,
    refreshState
  };
};

export default useNotifications;