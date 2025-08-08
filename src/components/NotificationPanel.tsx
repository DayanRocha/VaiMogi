
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Trash2, Check, MessageCircle } from 'lucide-react';
import { GuardianNotification } from '@/hooks/useGuardianData';
import { RealTimeNotification } from '@/services/realTimeNotificationService';

interface CombinedNotification {
  id: string;
  isRealTime: boolean;
  // For real-time notifications
  guardianId?: string;
  type: 'route_started' | 'arrived_at_location' | 'student_picked_up' | 'student_dropped_off' | 'route_completed' | 'route_delayed' | 'arriving_soon' | 'van_arrived' | 'embarked' | 'at_school' | 'disembarked';
  title?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  studentId?: string;
  studentName?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: GuardianNotification[];
  realTimeNotifications: RealTimeNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkRealTimeAsRead: (notificationId: string) => void;
  onMarkAllRealTimeAsRead: () => void;
  onDeleteRealTimeNotification: (notificationId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onDeleteNotifications: (notificationIds: string[]) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
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
}) => {
  if (!isOpen) return null;

  // Combinar notificações
  const allNotifications: CombinedNotification[] = [
    ...realTimeNotifications.map(n => ({ ...n, isRealTime: true })),
    ...notifications.map(n => ({ ...n, isRealTime: false }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'route_started':
        return '🚐';
      case 'student_picked_up':
      case 'embarked':
        return '👋';
      case 'arrived_at_location':
      case 'van_arrived':
        return '📍';
      case 'student_dropped_off':
      case 'disembarked':
        return '🏫';
      case 'route_completed':
        return '✅';
      case 'route_delayed':
        return '⏰';
      case 'arriving_soon':
        return '🚨';
      case 'at_school':
        return '🎒';
      default:
        return '📢';
    }
  };

  const handleMarkAsRead = (notification: CombinedNotification) => {
    if (notification.isRealTime) {
      onMarkRealTimeAsRead(notification.id);
    } else {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (notification: CombinedNotification) => {
    if (notification.isRealTime) {
      onDeleteRealTimeNotification(notification.id);
    } else {
      onDeleteNotification(notification.id);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Agora';
      if (diffMins < 60) return `${diffMins} min atrás`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)} h atrás`;
      return date.toLocaleDateString();
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Notificações</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllRealTimeAsRead}
                className="text-blue-600 hover:bg-blue-50"
              >
                <Check className="w-4 h-4 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {allNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação</h3>
              <p className="text-sm text-gray-500">
                Você será notificado sobre atualizações da rota aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors ${
                    notification.isRead 
                      ? 'bg-white' 
                      : 'bg-blue-50 border-l-4 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {notification.title && (
                          <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {notification.title}
                          </h4>
                        )}
                        {notification.isRealTime && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Tempo Real
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification)}
                              className="text-blue-600 hover:bg-blue-50 h-auto p-1"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification)}
                            className="text-red-600 hover:bg-red-50 h-auto p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
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
