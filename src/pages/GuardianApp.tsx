
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuardianMapView from '@/components/GuardianMapView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
  const [showMap, setShowMap] = useState(false);
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

  // Controlar visibilidade do mapa baseado na rota ativa
  useEffect(() => {
    if (hasActiveRoute) {
      console.log('🗺️ Rota iniciada - abrindo mapa automaticamente');
      setShowMap(true);
    } else {
      console.log('🗺️ Rota encerrada - ocultando mapa automaticamente');
      setShowMap(false);
    }
  }, [hasActiveRoute]);

  // Notificações em tempo real
  const {
    notifications: realTimeNotifications,
    unreadCount: realTimeUnreadCount,
    markAsRead: markRealTimeAsRead,
    markAllAsRead: markAllRealTimeAsRead,
    deleteNotification: deleteRealTimeNotification
  } = useRealTimeNotifications(guardian.id);

  // Detectar notificações de início e fim de rota para controlar o mapa
  useEffect(() => {
    const latestNotification = realTimeNotifications[0];
    if (latestNotification) {
      if (latestNotification.type === 'route_started') {
        console.log('🚌 Notificação de rota iniciada recebida - abrindo mapa');
        setShowMap(true);
      } else if (latestNotification.type === 'route_completed') {
        console.log('🏁 Notificação de rota finalizada recebida - ocultando mapa');
        setShowMap(false);
      }
    }
  }, [realTimeNotifications]);

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

      {/* Main Map View - Mostrado apenas quando há rota ativa */}
      {showMap ? (
        <div className="h-[calc(100vh-64px)] relative">
          <ErrorBoundary>
            <GuardianMapView
              driver={driver}
              van={van}
              students={students}
              activeTrip={activeTrip}
              guardianId={guardian.id}
            />
          </ErrorBoundary>
        </div>
      ) : (
        <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Aguardando Rota</h3>
            <p className="text-gray-600 mb-4">O mapa será exibido automaticamente quando o motorista iniciar a rota.</p>
            <div className="text-sm text-gray-500">
              <p>• Você receberá uma notificação quando a rota iniciar</p>
              <p>• O mapa mostrará a localização em tempo real</p>
              <p>• Será ocultado automaticamente quando a rota terminar</p>
            </div>
          </div>
        </div>
      )}

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
