import React, { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Bell, Check, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  studentName?: string;
}

interface RealTimeNotification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  guardianIds: string[];
  title?: string;
  isRealTime?: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  realTimeNotifications: RealTimeNotification[];
  onMarkAsRead: (notification: Notification) => void;
  onMarkRealTimeAsRead: (notification: RealTimeNotification) => void;
  onMarkAllRealTimeAsRead: () => void;
  onDeleteRealTimeNotification: (notification: RealTimeNotification) => void;
  onDeleteNotification: (notification: Notification) => void;
  onDeleteNotifications: () => void;
}

const formatTimestamp = (timestamp: string) => {
  try {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch (error) {
    console.error("Erro ao formatar a data:", error);
    return "Data inválida";
  }
};

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const combinedNotifications = [...realTimeNotifications.map(rt => ({ ...rt, isRealTime: true })), ...notifications]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleMarkAsRead = (notification: any) => {
    if (notification.isRealTime) {
      onMarkRealTimeAsRead(notification);
    } else {
      onMarkAsRead(notification);
    }
  };

  const handleDelete = (notification: any) => {
    if (notification.isRealTime) {
      onDeleteRealTimeNotification(notification);
    } else {
      onDeleteNotification(notification);
    }
  };

  const handleMarkAllAsRead = () => {
    onMarkAllRealTimeAsRead();
  };

  const handleDeleteAll = () => {
    onDeleteNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'route_started':
        return '🚀';
      case 'student_picked_up':
      case 'embarked':
        return '📍';
      case 'student_dropped_off':
      case 'disembarked':
        return '🏠';
      case 'arrived_at_location':
      case 'van_arrived':
        return '🚐';
      case 'at_school':
        return '🏫';
      case 'route_completed':
        return '✅';
      case 'route_delayed':
        return '⏰';
      case 'arriving_soon':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationTitle = (notification: any): string => {
    // Para notificações em tempo real que têm propriedade title
    if (notification.title) {
      return notification.title;
    }

    // Para notificações legacy, gerar título baseado no tipo
    switch (notification.type) {
      case 'embarked':
        return 'Estudante Embarcou';
      case 'at_school':
        return 'Chegou na Escola';
      case 'van_arrived':
        return 'Van Chegou';
      case 'disembarked':
        return 'Estudante Desembarcou';
      default:
        return 'Notificação';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </SheetTitle>
            {combinedNotifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                >
                  Marcar todas como lidas
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                >
                  Limpar todas
                </button>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {combinedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Bell className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
              <p className="text-sm text-center">
                Você será notificado sobre atualizações da rota aqui
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {combinedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-3 transition-colors ${
                    notification.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 mb-1 break-words">
                          {getNotificationTitle(notification)}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 break-words leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{formatTimestamp(notification.timestamp)}</span>
                          {notification.isRealTime && (
                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-medium">
                              Tempo Real
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Marcar como lida"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Excluir notificação"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
