import { X, Bell, MapPin, User, School, Home, Truck, Trash2, CheckSquare, Square, Clock, Navigation, CheckCircle } from 'lucide-react';
import { GuardianNotification } from '@/hooks/useGuardianData';
import { RealTimeNotification } from '@/services/realTimeNotificationService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: GuardianNotification[];
  realTimeNotifications?: RealTimeNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkRealTimeAsRead?: (notificationId: string) => void;
  onMarkAllRealTimeAsRead?: () => void;
  onDeleteRealTimeNotification?: (notificationId: string) => void;
  onDeleteNotification?: (notificationId: string) => void;
  onDeleteNotifications?: (notificationIds: string[]) => void;
}

export const NotificationPanel = ({ 
  isOpen, 
  onClose, 
  notifications, 
  realTimeNotifications = [],
  onMarkAsRead,
  onMarkRealTimeAsRead,
  onMarkAllRealTimeAsRead,
  onDeleteRealTimeNotification,
  onDeleteNotification,
  onDeleteNotifications
}: NotificationPanelProps) => {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const getNotificationIcon = (type: GuardianNotification['type'] | RealTimeNotification['type']) => {
    switch (type) {
      case 'van_arrived':
      case 'arrived_at_location':
        return <Truck className="w-5 h-5 text-orange-500" />;
      case 'embarked':
      case 'student_picked_up':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'at_school':
        return <School className="w-5 h-5 text-green-500" />;
      case 'disembarked':
      case 'student_dropped_off':
        return <Home className="w-5 h-5 text-purple-500" />;
      case 'route_started':
        return <Navigation className="w-5 h-5 text-blue-600" />;
      case 'arriving_soon':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'route_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'route_delayed':
        return <Clock className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: GuardianNotification['type'] | RealTimeNotification['type']) => {
    switch (type) {
      case 'van_arrived':
      case 'arrived_at_location':
        return 'border-l-orange-500 bg-orange-50';
      case 'embarked':
      case 'student_picked_up':
        return 'border-l-blue-500 bg-blue-50';
      case 'at_school':
        return 'border-l-green-500 bg-green-50';
      case 'disembarked':
      case 'student_dropped_off':
        return 'border-l-purple-500 bg-purple-50';
      case 'route_started':
        return 'border-l-blue-600 bg-blue-50';
      case 'arriving_soon':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'route_completed':
        return 'border-l-green-600 bg-green-50';
      case 'route_delayed':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Data inválida';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleNotificationClick = (notification: any) => {
    if (isSelectionMode) {
      const isSelected = selectedNotifications.includes(notification.id);
      if (isSelected) {
        setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
      } else {
        setSelectedNotifications(prev => [...prev, notification.id]);
      }
      return;
    }

    if (!notification.isRead) {
      if (notification.isRealTime && onMarkRealTimeAsRead) {
        const originalId = notification.id.replace(/^rt_(.+)_\d+$/, '$1');
        onMarkRealTimeAsRead(originalId);
      } else {
        const originalId = notification.id.replace(/^legacy_(.+)_\d+$/, '$1');
        onMarkAsRead(originalId);
      }
    }
    
    // Se tem localização, abrir no Google Maps
    if (notification.location) {
      const url = `https://www.google.com/maps?q=${notification.location.lat},${notification.location.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleDeleteSingle = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Encontrar a notificação original
    const notification = allNotifications.find(n => n.id === notificationId);
    if (!notification) return;

    if (notification.isRealTime && onDeleteRealTimeNotification) {
      // Para notificações em tempo real, extrair o ID original
      const originalId = notificationId.replace(/^rt_(.+)_\d+$/, '$1');
      console.log('🗑️ Excluindo notificação RT:', originalId);
      onDeleteRealTimeNotification(originalId);
    } else if (onDeleteNotification) {
      // Para notificações legadas
      const originalId = notificationId.replace(/^legacy_(.+)_\d+$/, '$1');
      console.log('🗑️ Excluindo notificação legada:', originalId);
      onDeleteNotification(originalId);
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === allNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(allNotifications.map(n => n.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNotifications.length > 0) {
      selectedNotifications.forEach(notificationId => {
        const notification = allNotifications.find(n => n.id === notificationId);
        if (!notification) return;

        if (notification.isRealTime && onDeleteRealTimeNotification) {
          // Para notificações em tempo real, excluir
          const originalId = notificationId.replace(/^rt_(.+)_\d+$/, '$1');
          onDeleteRealTimeNotification(originalId);
        } else if (onDeleteNotification) {
          // Para notificações legadas, excluir
          const originalId = notificationId.replace(/^legacy_(.+)_\d+$/, '$1');
          onDeleteNotification(originalId);
        }
      });
      
      setSelectedNotifications([]);
      setIsSelectionMode(false);
    }
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotifications([]);
  };

  // Combinar notificações legadas e em tempo real
  const allNotifications = [
    ...realTimeNotifications.map((n, index) => ({ ...n, id: `rt_${n.id}_${index}`, isRealTime: true })),
    ...notifications.map((n, index) => ({ ...n, id: `legacy_${n.id}_${index}`, isRealTime: false }))
  ].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
    return dateB.getTime() - dateA.getTime();
  });

  const unreadNotifications = allNotifications.filter(n => !n.isRead);
  const readNotifications = allNotifications.filter(n => n.isRead);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Notificações
              {unreadNotifications.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadNotifications.length}
                </span>
              )}
            </div>
            {allNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSelectionMode}
                className="text-sm"
              >
                {isSelectionMode ? 'Cancelar' : 'Selecionar'}
              </Button>
            )}
          </DialogTitle>
          {isSelectionMode && allNotifications.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedNotifications.length === allNotifications.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedNotifications.length === allNotifications.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </Button>
              {selectedNotifications.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir ({selectedNotifications.length})
                </Button>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {allNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma notificação</p>
            </div>
          ) : (
            <>
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-3">Não lidas</h3>
                  <div className="space-y-2">
                    {unreadNotifications.map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`border-l-4 p-3 rounded-r-lg cursor-pointer hover:shadow-md transition-shadow ${getNotificationColor(notification.type)} ${isSelectionMode ? 'bg-gray-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {isSelectionMode && (
                            <Checkbox
                              checked={selectedNotifications.includes(notification.id)}
                              onCheckedChange={() => handleNotificationClick(notification)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {notification.isRealTime ? notification.title : notification.studentName}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.timestamp)}
                              </span>
                              {notification.location && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <MapPin className="w-3 h-3" />
                                  Ver localização
                                </div>
                              )}
                            </div>
                          </div>
                          {!isSelectionMode ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDeleteSingle(notification.id, e)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-3">Anteriores</h3>
                  <div className="space-y-2">
                    {readNotifications.slice(0, 10).map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`border-l-4 p-3 rounded-r-lg cursor-pointer hover:shadow-md transition-shadow opacity-75 ${getNotificationColor(notification.type)} ${isSelectionMode ? 'bg-gray-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {isSelectionMode && (
                            <Checkbox
                              checked={selectedNotifications.includes(notification.id)}
                              onCheckedChange={() => handleNotificationClick(notification)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700">
                              {notification.isRealTime ? notification.title : notification.studentName}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.timestamp)}
                              </span>
                              {notification.location && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <MapPin className="w-3 h-3" />
                                  Ver localização
                                </div>
                              )}
                            </div>
                          </div>
                          {!isSelectionMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteSingle(notification.id, e)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              unreadNotifications.forEach(n => {
                if (n.isRealTime && onMarkRealTimeAsRead) {
                  const originalId = n.id.replace(/^rt_(.+)_\d+$/, '$1');
                  onMarkRealTimeAsRead(originalId);
                } else {
                  const originalId = n.id.replace(/^legacy_(.+)_\d+$/, '$1');
                  onMarkAsRead(originalId);
                }
              });
              if (onMarkAllRealTimeAsRead) {
                onMarkAllRealTimeAsRead();
              }
            }}
            disabled={unreadNotifications.length === 0}
          >
            Marcar todas como lidas
          </Button>
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};