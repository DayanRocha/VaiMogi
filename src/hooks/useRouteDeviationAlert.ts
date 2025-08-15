import { useState, useEffect, useCallback } from 'react';
import { realTimeTrackingService } from '@/services/realTimeTrackingService';
import { useNotificationToasts } from '@/hooks/useNotificationToasts';

interface RouteDeviationState {
  isOffRoute: boolean;
  distance: number;
  distanceFromRoute?: number; // Compatibility property
  lastRecalculation?: string;
  consecutiveDeviations: number;
  alertShown: boolean;
}

interface UseRouteDeviationAlertReturn {
  // Estado
  isAlertVisible: boolean;
  deviationState: RouteDeviationState;
  isRecalculating: boolean;
  
  // Ações
  showAlert: () => void;
  hideAlert: () => void;
  forceRecalculation: () => Promise<boolean>;
  resetDeviationCount: () => void;
  
  // Configurações
  setAlertThreshold: (threshold: number) => void;
  setAutoHideDelay: (delay: number) => void;
}

interface UseRouteDeviationAlertOptions {
  autoShow?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  alertThreshold?: number;
  enableToastNotifications?: boolean;
  onDeviationDetected?: (state: RouteDeviationState) => void;
  onRouteRecalculated?: (success: boolean) => void;
  onBackOnRoute?: () => void;
}

export const useRouteDeviationAlert = (options: UseRouteDeviationAlertOptions = {}): UseRouteDeviationAlertReturn => {
  const {
    autoShow = true,
    autoHide = true,
    autoHideDelay = 10000, // 10 segundos
    alertThreshold = 2, // Mostrar alerta após 2 desvios consecutivos
    enableToastNotifications = true,
    onDeviationDetected,
    onRouteRecalculated,
    onBackOnRoute
  } = options;

  const { addToast } = useNotificationToasts();
  
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [autoHideTimeout, setAutoHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentThreshold, setCurrentThreshold] = useState(alertThreshold);
  const [currentAutoHideDelay, setCurrentAutoHideDelay] = useState(autoHideDelay);
  
  const [deviationState, setDeviationState] = useState<RouteDeviationState>({
    isOffRoute: false,
    distance: 0,
    consecutiveDeviations: 0,
    alertShown: false
  });

  // Função para verificar status de desvio
  const checkDeviationStatus = useCallback(() => {
    const status = realTimeTrackingService.getOffRouteStatus();
    const activeRoute = realTimeTrackingService.getActiveTrackingRoute();
    
    if (!activeRoute) {
      // Reset se não há rota ativa
      setDeviationState({
        isOffRoute: false,
        distance: 0,
        consecutiveDeviations: 0,
        alertShown: false
      });
      return;
    }

    setDeviationState(prevState => {
      const newState = {
        ...prevState,
        isOffRoute: status.isOffRoute,
        distance: status.distanceFromRoute || 0,
        distanceFromRoute: status.distanceFromRoute || 0, // Compatibility
        lastRecalculation: status.lastRecalculation
      };

      // Atualizar contador de desvios consecutivos
      if (status.isOffRoute) {
        if (!prevState.isOffRoute) {
          // Primeiro desvio detectado
          newState.consecutiveDeviations = 1;
          newState.alertShown = false;
        } else {
          // Continua fora da rota
          newState.consecutiveDeviations = prevState.consecutiveDeviations;
        }
      } else {
        if (prevState.isOffRoute) {
          // Voltou à rota
          newState.consecutiveDeviations = 0;
          newState.alertShown = false;
          
          if (enableToastNotifications) {
            addToast({
              type: 'success',
              title: '✅ De volta à rota',
              message: 'O motorista retornou à rota planejada',
              duration: 5000
            });
          }
          
          onBackOnRoute?.();
        }
      }

      return newState;
    });
  }, [enableToastNotifications, addToast, onBackOnRoute]);

  // Efeito para monitorar desvios
  useEffect(() => {
    const interval = setInterval(checkDeviationStatus, 2000); // Verificar a cada 2 segundos
    return () => clearInterval(interval);
  }, [checkDeviationStatus]);

  // Efeito para mostrar alerta automaticamente
  useEffect(() => {
    if (autoShow && 
        deviationState.isOffRoute && 
        deviationState.consecutiveDeviations >= currentThreshold && 
        !deviationState.alertShown) {
      
      setIsAlertVisible(true);
      setDeviationState(prev => ({ ...prev, alertShown: true }));
      
      // Notificação toast
      if (enableToastNotifications) {
        addToast({
          type: 'warning',
          title: '⚠️ Desvio de Rota',
          message: `Motorista está ${Math.round(deviationState.distance || 0)}m fora da rota`,
          duration: 8000
        });
      }
      
      onDeviationDetected?.(deviationState);
    }
  }, [autoShow, deviationState, currentThreshold, enableToastNotifications, addToast, onDeviationDetected]);

  // Efeito para auto-ocultar alerta
  useEffect(() => {
    if (isAlertVisible && autoHide) {
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
      
      const timeout = setTimeout(() => {
        setIsAlertVisible(false);
      }, currentAutoHideDelay);
      
      setAutoHideTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [isAlertVisible, autoHide, currentAutoHideDelay]);

  // Função para mostrar alerta manualmente
  const showAlert = useCallback(() => {
    setIsAlertVisible(true);
    setDeviationState(prev => ({ ...prev, alertShown: true }));
  }, []);

  // Função para ocultar alerta
  const hideAlert = useCallback(() => {
    setIsAlertVisible(false);
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout);
      setAutoHideTimeout(null);
    }
  }, [autoHideTimeout]);

  // Função para forçar recálculo
  const forceRecalculation = useCallback(async (): Promise<boolean> => {
    setIsRecalculating(true);
    
    try {
      const success = await realTimeTrackingService.forceRouteRecalculation();
      
      if (success) {
        if (enableToastNotifications) {
          addToast({
            type: 'info',
            title: '🔄 Rota Recalculada',
            message: 'Nova rota calculada com sucesso',
            duration: 5000
          });
        }
        
        // Verificar status após recálculo
        setTimeout(checkDeviationStatus, 1000);
      } else {
        if (enableToastNotifications) {
          addToast({
            type: 'error',
            title: '❌ Erro no Recálculo',
            message: 'Não foi possível recalcular a rota',
            duration: 5000
          });
        }
      }
      
      onRouteRecalculated?.(success);
      return success;
      
    } catch (error) {
      console.error('❌ Erro ao recalcular rota:', error);
      
      if (enableToastNotifications) {
        addToast({
          type: 'error',
          title: '❌ Erro no Recálculo',
          message: 'Falha na comunicação com o servidor',
          duration: 5000
        });
      }
      
      onRouteRecalculated?.(false);
      return false;
      
    } finally {
      setIsRecalculating(false);
    }
  }, [enableToastNotifications, addToast, checkDeviationStatus, onRouteRecalculated]);

  // Função para resetar contador de desvios
  const resetDeviationCount = useCallback(() => {
    setDeviationState(prev => ({
      ...prev,
      consecutiveDeviations: 0,
      alertShown: false
    }));
  }, []);

  // Função para configurar threshold
  const setAlertThreshold = useCallback((threshold: number) => {
    setCurrentThreshold(Math.max(1, threshold));
  }, []);

  // Função para configurar delay de auto-hide
  const setAutoHideDelay = useCallback((delay: number) => {
    setCurrentAutoHideDelay(Math.max(1000, delay));
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
    };
  }, []);

  return {
    // Estado
    isAlertVisible,
    deviationState,
    isRecalculating,
    
    // Ações
    showAlert,
    hideAlert,
    forceRecalculation,
    resetDeviationCount,
    
    // Configurações
    setAlertThreshold,
    setAutoHideDelay
  };
};

export default useRouteDeviationAlert;