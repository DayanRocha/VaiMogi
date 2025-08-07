import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuardianMapView } from '@/components/GuardianMapView';
import { GuardianHeader } from '@/components/GuardianHeader';
import { GuardianMenuModal } from '@/components/GuardianMenuModal';
import { NotificationPanel } from '@/components/NotificationPanel';
import { GuardianWelcomeDialog } from '@/components/GuardianWelcomeDialog';

import { useGuardianData } from '@/hooks/useGuardianData';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { audioService } from '@/services/audioService';
import { initNotificationCleanup } from '@/utils/notificationCleanup';

export const GuardianApp = () => {
  const navigate = useNavigate();
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [autoFocusMap, setAutoFocusMap] = useState(false);
  const { 
    guardian, 
    driver, 
    van, 
    students, 
    schools,
    activeTrip, 
    notifications: legacyNotifications,
    markNotificationAsRead,
    deleteNotification,
    deleteNotifications
  } = useGuardianData();

  // Hook para rastreamento de rota
  const { hasActiveRoute, activeRoute } = useRouteTracking();

  // Notificações em tempo real
  const {
    notifications: realTimeNotifications,
    unreadCount: realTimeUnreadCount,
    markAsRead: markRealTimeAsRead,
    markAllAsRead: markAllRealTimeAsRead,
    deleteNotification: deleteRealTimeNotification
  } = useRealTimeNotifications(guardian.id);

  // Filtrar notificações legadas que podem ser duplicadas
  const filteredLegacyNotifications = legacyNotifications.filter(legacy => {
    // Verificar se há uma notificação em tempo real similar
    const hasSimilarRealTime = realTimeNotifications.some(rt => 
      rt.message.includes(legacy.studentName || '') && 
      Math.abs(new Date(rt.timestamp).getTime() - new Date(legacy.timestamp).getTime()) < 60000 // 1 minuto
    );
    return !hasSimilarRealTime;
  });

  // Combinar notificações (priorizando tempo real)
  const allNotifications = [...realTimeNotifications, ...filteredLegacyNotifications];
  const totalUnreadCount = realTimeUnreadCount + filteredLegacyNotifications.filter(n => !n.isRead).length;

  // Detectar quando uma rota é iniciada e focar automaticamente no mapa
  useEffect(() => {
    if (hasActiveRoute && activeRoute) {
      console.log('🗺️ Rota detectada - focando automaticamente no mapa:', {
        driverName: activeRoute.driverName,
        studentsCount: activeRoute.studentPickups?.length || 0
      });
      
      // Fechar todos os modais para focar no mapa
      setShowMenuModal(false);
      setShowNotifications(false);
      setAutoFocusMap(true);
      
      // Mostrar notificação visual de que o mapa foi ativado
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🗺️ Mapa Ativado', {
          body: `Rota iniciada por ${activeRoute.driverName}. Acompanhe a localização da van em tempo real.`,
          icon: '/vai-mogi.png'
        });
      }
      
      // Reset do auto focus após 3 segundos
      setTimeout(() => {
        setAutoFocusMap(false);
      }, 3000);
    }
  }, [hasActiveRoute, activeRoute]);

  // Verificar se o responsável ainda está ativo
  useEffect(() => {
    const checkGuardianStatus = () => {
      const savedGuardians = localStorage.getItem('guardians');
      if (savedGuardians) {
        try {
          const guardians = JSON.parse(savedGuardians);
          const currentGuardian = guardians.find((g: any) => g.id === guardian.id);
          
          if (currentGuardian && currentGuardian.isActive === false) {
            console.log('🚫 Responsável foi desativado pelo motorista');
            alert('Seu acesso foi desativado pelo motorista. Você será redirecionado para a tela de login.');
            
            // Limpar dados e redirecionar
            localStorage.removeItem('guardianData');
            localStorage.removeItem('guardianLoggedIn');
            navigate('/auth');
            return;
          }
        } catch (error) {
          console.error('Erro ao verificar status do responsável:', error);
        }
      }
    };

    // Verificar status imediatamente
    checkGuardianStatus();
    
    // Verificar status a cada 30 segundos
    const interval = setInterval(checkGuardianStatus, 30000);
    
    return () => clearInterval(interval);
  }, [guardian.id, navigate]);

  // Verificar se é o primeiro acesso do responsável
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(`guardianWelcome_${guardian.id}`);
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [guardian.id]);

  // Inicializar serviço de áudio e limpeza de notificações
  useEffect(() => {
    const initAudio = async () => {
      await audioService.init();
    };
    
    initAudio();
    
    // Inicializar limpeza de notificações
    initNotificationCleanup();
    
    // Tentar solicitar permissão de áudio após primeira interação
    const handleFirstInteraction = async () => {
      await audioService.requestAudioPermission();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Tem certeza que deseja sair?');
    
    if (confirmLogout) {
      // Limpar dados do responsável do localStorage
      localStorage.removeItem('guardianData');
      localStorage.removeItem('guardianLoggedIn');
      
      console.log('🚪 Logout do responsável realizado');
      
      // Redirecionar para a tela de login
      navigate('/auth');
    }
  };

  const handleWelcomeClose = () => {
    // Marcar que o responsável já viu as boas-vindas
    localStorage.setItem(`guardianWelcome_${guardian.id}`, 'true');
    setShowWelcome(false);
    console.log(`👋 Boas-vindas mostradas para ${guardian.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <GuardianHeader
        guardian={guardian}
        notifications={allNotifications}
        unreadCount={totalUnreadCount}
        onMenuClick={() => setShowMenuModal(true)}
        onNotificationClick={() => setShowNotifications(true)}
        onLogout={handleLogout}
      />

      {/* Main Map View */}
      <div className="h-[calc(100vh-64px)] relative">
        <GuardianMapView
          driver={driver}
          van={van}
          students={students}
          activeTrip={activeTrip}
        />
        
        {/* Indicador de Auto Focus do Mapa */}
        {autoFocusMap && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg border border-blue-700 animate-pulse z-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              <span className="text-sm font-semibold">🗺️ Mapa Ativado Automaticamente</span>
            </div>
            <p className="text-xs mt-1 opacity-90">
              Rota iniciada - Acompanhe a localização em tempo real
            </p>
          </div>
        )}
      </div>

      {/* Guardian Menu Modal */}
      <GuardianMenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        driver={driver}
        van={van}
        guardian={guardian}
        children={students}
        schools={schools}
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={filteredLegacyNotifications}
        realTimeNotifications={realTimeNotifications}
        onMarkAsRead={markNotificationAsRead}
        onMarkRealTimeAsRead={markRealTimeAsRead}
        onMarkAllRealTimeAsRead={markAllRealTimeAsRead}
        onDeleteRealTimeNotification={deleteRealTimeNotification}
        onDeleteNotification={deleteNotification}
        onDeleteNotifications={deleteNotifications}
      />

      {/* Welcome Dialog */}
      <GuardianWelcomeDialog
        isOpen={showWelcome}
        onClose={handleWelcomeClose}
        guardianName={guardian.name}
      />


    </div>
  );
};