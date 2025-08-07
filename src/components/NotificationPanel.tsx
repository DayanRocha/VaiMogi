
import React, { useState } from 'react';
import { X, Bell, Trash2, Check, CheckCheck, Clock, MapPin } from 'lucide-react';
import { GuardianNotification } from '@/hooks/useGuardianData';

interface RealTimeNotification {
  id: string;
  type: 'route_started' | 'student_picked_up' | 'student_dropped_off' | 'arriving_soon' | 'arrived_at_location' | 'route_completed' | 'route_delayed';
  message: string;
  timestamp: string;
  isRead: boolean;
  studentName?: string;
  location?: {
    lat: number;
    lng: number;
  };
  routeId?: string;
  guardianIds: string[];
}

// Union type for combined notifications
type CombinedNotification = (GuardianNotification & { isRealTime: false; title?: string }) | (RealTimeNotification & { isRealTime: true; title?: string });

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: GuardianNotification[];
  realTimeNotifications: RealTimeNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkRealTimeAsRead: (notification: RealTimeNotification) => void;
  onMarkAllRealTimeAsRead: () => void;
  onDeleteRealTimeNotification: (notification: RealTimeNotification) => void;
  onDeleteNotification: (notificationId: string) => void;
  onDeleteNotifications: (notificationIds: string[]) => void;
}

export const NotificationPanel = ({
  isOpen,
  onClose,
  notifications,
  realTimeNotifications,
  onMarkAsRead,
  onMarkRealTimeAsRead,
  onMarkAllRealTimeAsRead,
  onDeleteRealTimeNotification,
  onDeleteNotification,
  onDeleteNotifications
}: NotificationPanelProps) => {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);

  // Combinar e organizar notificações
  const combinedNotifications: CombinedNotification[] = [
    ...realTimeNotifications.map(n => ({ 
      ...n, 
      isRealTime: true as const,
      title: getNotificationTitle(n.type)
    })),
    ...notifications.map(n => ({ 
      ...n, 
      isRealTime: false as const,
      title: getNotificationTitle(n.type)
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = combinedNotifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'van_arrived':
      case 'arriving_soon':
      case 'arrived_at_location':
        return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'embarked':
      case 'student_picked_up':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'at_school':
      case 'student_dropped_off':
        return <CheckCheck className="w-5 h-5 text-purple-600" />;
      case 'disembarked':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'route_started':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'route_completed':
        return <CheckCheck className="w-5 h-5 text-green-600" />;
      case 'route_delayed':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  function getNotificationTitle(type: string): string {
    switch (type) {
      case 'van_arrived':
        return 'Van Chegou';
      case 'embarked':
        return 'Embarque Realizado';
      case 'at_school':
        return 'Chegou na Escola';
      case 'disembarked':
        return 'Desembarque Realizado';
      case 'route_started':
        return 'Rota Iniciada';
      case 'student_picked_up':
        return 'Estudante Embarcou';
      case 'student_dropped_off':
        return 'Estudante Desembarcou';
      case 'arriving_soon':
        return 'Chegando em Breve';
      case 'arrived_at_location':
        return 'Chegou ao Local';
      case 'route_completed':
        return 'Rota Concluída';
      case 'route_delayed':
        return 'Rota Atrasada';
      default:
        return 'Notificação';
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}min atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification: CombinedNotification) => {
    if (showSelectionMode) {
      toggleNotificationSelection(notification.id);
      return;
    }

    if (!notification.isRead) {
      if (notification.isRealTime) {
        onMarkRealTimeAsRead(notification as RealTimeNotification);
      } else {
        onMarkAsRead(notification.id);
      }
    }
  };

  const toggleNotificationSelection = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    const legacyIds = selectedNotifications.filter(id => {
      const notification = combinedNotifications.find(n => n.id === id);
      return notification && !notification.isRealTime;
    });
    
    const realTimeNotifications = selectedNotifications
      .map(id => combinedNotifications.find(n => n.id === id && n.isRealTime))
      .filter((n): n is RealTimeNotification & { isRealTime: true } => Boolean(n)) as RealTimeNotification[];

    if (legacyIds.length > 0) {
      onDeleteNotifications(legacyIds);
    }
    
    realTimeNotifications.forEach(notification => {
      onDeleteRealTimeNotification(notification);
    });

    setSelectedNotifications([]);
    setShowSelectionMode(false);
  };

  const handleMarkAllAsRead = () => {
    // Marcar todas as notificações em tempo real como lidas
    onMarkAllRealTimeAsRead();
    
    // Marcar todas as notificações legacy como lidas
    const unreadLegacy = notifications.filter(n => !n.isRead);
    unreadLegacy.forEach(notification => {
      onMarkAsRead(notification.id);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Notificações</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {combinedNotifications.length > 0 && (
              <>
                {showSelectionMode ? (
                  <div className="flex gap-2">
                    {selectedNotifications.length > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowSelectionMode(false);
                        setSelectedNotifications([]);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Marcar todas
                      </button>
                    )}
                    <button
                      onClick={() => setShowSelectionMode(true)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Selecionar
                    </button>
                  </div>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {combinedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Bell className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-sm text-gray-400">
                Você receberá notificações sobre a van e seus filhos aqui
              </p>
            </div>
          ) : (
            <div className="p-2">
              {combinedNotifications.map((notification) => (
                <div
                  key={`${notification.isRealTime ? 'rt' : 'legacy'}-${notification.id}`}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'bg-gray-50 hover:bg-gray-100' 
                      : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                  } ${
                    showSelectionMode && selectedNotifications.includes(notification.id)
                      ? 'ring-2 ring-blue-500'
                      : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {showSelectionMode && (
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleNotificationSelection(notification.id)}
                        className="mt-1"
                      />
                    )}
                    
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {notification.title || getNotificationTitle(notification.type)}
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {notification.message}
                          </p>
                          {notification.studentName && (
                            <p className="text-xs text-gray-500 mt-1">
                              👤 {notification.studentName}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end ml-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                          )}
                          {notification.isRealTime && (
                            <span className="text-xs bg-green-100 text-green-800 px-1 rounded mt-1">
                              Tempo real
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {'location' in notification && notification.location && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>Localização disponível</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
