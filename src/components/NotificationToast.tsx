import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Car } from 'lucide-react';

interface NotificationData {
  id: string;
  type: 'proximity' | 'arrival' | 'delay' | 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  studentName?: string;
  driverName?: string;
  distance?: number;
  timestamp: number;
  duration?: number; // Duração em ms para auto-dismiss
}

interface NotificationToastProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
  onAction?: (id: string, action: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = notification.duration || 8000; // 8 segundos por padrão

  useEffect(() => {
    // Animar entrada
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    // Animar barra de progresso
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
      clearInterval(progressInterval);
    };
  }, [duration]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(notification.id, action);
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'proximity':
        return <Car className="w-6 h-6 text-orange-500" />;
      case 'arrival':
        return <MapPin className="w-6 h-6 text-green-500" />;
      case 'delay':
        return <Clock className="w-6 h-6 text-red-500" />;
      default:
        return <Car className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'proximity':
        return 'bg-orange-50 border-orange-200';
      case 'arrival':
        return 'bg-green-50 border-green-200';
      case 'delay':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getProgressColor = () => {
    switch (notification.type) {
      case 'proximity':
        return 'bg-orange-500';
      case 'arrival':
        return 'bg-green-500';
      case 'delay':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-lg border shadow-lg overflow-hidden ${getBackgroundColor()}`}>
        {/* Barra de progresso */}
        <div className="h-1 bg-gray-200">
          <div
            className={`h-full transition-all duration-100 ease-linear ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Ícone */}
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>

            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-700 mb-2">
                {notification.message}
              </p>

              {/* Informações adicionais */}
              {(notification.studentName || notification.distance) && (
                <div className="text-xs text-gray-600 space-y-1">
                  {notification.studentName && (
                    <div className="flex items-center gap-1">
                      <span>👤</span>
                      <span>{notification.studentName}</span>
                    </div>
                  )}
                  {notification.distance && (
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{notification.distance}m de distância</span>
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleAction('view')}
                  className="text-xs bg-white text-gray-700 hover:bg-gray-50 px-3 py-1 rounded-full border transition-colors"
                >
                  👀 Ver no Mapa
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Dispensar
                </button>
              </div>
            </div>

            {/* Botão fechar */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Container para gerenciar múltiplas notificações
interface NotificationContainerProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
  onAction?: (id: string, action: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onDismiss,
  onAction
}) => {
  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ top: `${1 + index * 6}rem` }}
          className="fixed right-4 z-50"
        >
          <NotificationToast
            notification={notification}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        </div>
      ))}
    </>
  );
};

export default NotificationToast;