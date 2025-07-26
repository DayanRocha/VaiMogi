import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuardianMapView } from '@/components/GuardianMapView';
import { GuardianHeader } from '@/components/GuardianHeader';
import { GuardianMenuModal } from '@/components/GuardianMenuModal';
import { NotificationPanel } from '@/components/NotificationPanel';
import { GuardianWelcomeDialog } from '@/components/GuardianWelcomeDialog';
import { useGuardianData } from '@/hooks/useGuardianData';

export const GuardianApp = () => {
  const navigate = useNavigate();
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { 
    guardian, 
    driver, 
    van, 
    students, 
    schools,
    activeTrip, 
    notifications,
    markNotificationAsRead 
  } = useGuardianData();

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
        notifications={notifications}
        onMenuClick={() => setShowMenuModal(true)}
        onNotificationClick={() => setShowNotifications(true)}
        onLogout={handleLogout}
      />

      {/* Main Map View */}
      <div className="h-[calc(100vh-64px)]">
        <GuardianMapView
          driver={driver}
          van={van}
          students={students}
          activeTrip={activeTrip}
        />
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
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
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