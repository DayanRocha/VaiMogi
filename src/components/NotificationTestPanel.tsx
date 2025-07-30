import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/services/notificationService';
import { audioService } from '@/services/audioService';
import { mockDriverMovement, mockLocations } from '@/services/mockLocationService';

export const NotificationTestPanel = () => {
  const [studentName] = useState('Pedro Silva');
  const [currentGuardianId, setCurrentGuardianId] = useState('');
  const [currentGuardianName, setCurrentGuardianName] = useState('');

  // Obter informações do responsável atual
  useEffect(() => {
    try {
      const guardianData = localStorage.getItem('guardianData');
      if (guardianData) {
        const parsed = JSON.parse(guardianData);
        setCurrentGuardianId(parsed.id || 'default');
        setCurrentGuardianName(parsed.name || 'Responsável');
      } else {
        setCurrentGuardianId('default');
        setCurrentGuardianName('Responsável (Mock)');
      }
    } catch (error) {
      console.error('Erro ao obter dados do responsável:', error);
      setCurrentGuardianId('default');
      setCurrentGuardianName('Responsável (Erro)');
    }
  }, []);

  const testNotifications = [
    {
      label: '🚀 Iniciar Rota',
      action: async () => await notificationService.notifyRouteStarted('1', studentName, 'to_school')
    },
    {
      label: '🚐 Van Chegou (Casa)',
      action: async () => await notificationService.notifyVanArrived('1', studentName, 'to_school', { lat: -23.550520, lng: -46.633308 })
    },
    {
      label: '👤 Embarcar (Casa → Escola)',
      action: async () => await notificationService.notifyEmbarked('1', studentName, 'to_school', { lat: -23.550520, lng: -46.633308 })
    },
    {
      label: '🏫 Chegou na Escola',
      action: async () => await notificationService.notifyAtSchool('1', studentName, 'Escola Municipal', { lat: -23.555520, lng: -46.638308 })
    },
    {
      label: '🚪 Desembarcar na Escola',
      action: async () => await notificationService.notifyDisembarked('1', studentName, 'to_school', 'Escola Municipal', undefined, { lat: -23.555520, lng: -46.638308 })
    },
    {
      label: '🚐 Van Chegou (Escola)',
      action: async () => await notificationService.notifyVanArrived('1', studentName, 'to_home', { lat: -23.555520, lng: -46.638308 })
    },
    {
      label: '👤 Embarcar (Escola → Casa)',
      action: async () => await notificationService.notifyEmbarked('1', studentName, 'to_home', { lat: -23.555520, lng: -46.638308 })
    },
    {
      label: '🏠 Desembarcar em Casa',
      action: async () => await notificationService.notifyDisembarked('1', studentName, 'to_home', undefined, 'Rua das Flores, 123', { lat: -23.550520, lng: -46.633308 })
    },
    {
      label: '🏁 Finalizar Rota',
      action: async () => await notificationService.notifyRouteFinished('to_home')
    }
  ];

  const handleTestSound = async () => {
    await audioService.testSound();
  };

  const handleClearNotifications = () => {
    notificationService.clearAllNotifications();
    alert('Notificações do responsável atual foram removidas!');
  };

  const handleClearAllUsersNotifications = () => {
    if (confirm('Tem certeza que deseja remover notificações de TODOS os responsáveis?')) {
      notificationService.clearAllUsersNotifications();
      alert('Notificações de todos os responsáveis foram removidas!');
    }
  };

  const handleStartRouteWithMap = async () => {
    console.log('🚀 Iniciando teste de rota com mapa...');
    
    try {
      // Limpar dados antigos primeiro
      localStorage.removeItem('activeRoute');
      
      // Criar dados de estudantes com localizações reais
      const mockStudents = mockLocations.slice(1).map((location, index) => ({
        id: `student_${index + 1}`,
        name: `Estudante ${index + 1}`,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        guardianId: currentGuardianId
      }));

      console.log('👥 Estudantes criados:', mockStudents);

      // Salvar estudantes mock no localStorage
      localStorage.setItem('students', JSON.stringify(mockStudents));

      // Garantir que há dados do motorista
      const driverData = {
        id: 'driver_1',
        name: 'DAYAN DE DEUS ROCHA',
        email: 'dayan@email.com',
        phone: '(11) 99999-9999'
      };
      localStorage.setItem('driverData', JSON.stringify(driverData));

      // Garantir que há dados da escola
      const schoolData = [{
        id: 'school_1',
        name: 'Escola Municipal São Paulo',
        address: 'Av. Brigadeiro Luís Antônio, 800 - Bela Vista, São Paulo - SP',
        lat: -23.5558,
        lng: -46.6396,
        phone: '(11) 3333-4444'
      }];
      localStorage.setItem('schools', JSON.stringify(schoolData));
      console.log('🏫 Escola criada:', schoolData[0]);

      // Criar rota manualmente para garantir que funciona
      const routeData = {
        id: Date.now().toString(),
        driverId: 'driver_1',
        driverName: 'João Silva',
        direction: 'to_school',
        startTime: new Date().toISOString(),
        isActive: true,
        currentLocation: {
          lat: mockLocations[0].lat,
          lng: mockLocations[0].lng,
          timestamp: new Date().toISOString(),
          accuracy: 10
        },
        studentPickups: mockStudents.map(student => ({
          studentId: student.id,
          studentName: student.name,
          address: student.address,
          lat: student.lat,
          lng: student.lng,
          status: 'pending' as const
        }))
      };

      // Salvar rota diretamente
      localStorage.setItem('activeRoute', JSON.stringify(routeData));
      console.log('🗺️ Rota criada manualmente:', routeData);

      // Iniciar movimento simulado do motorista
      mockDriverMovement.reset();
      mockDriverMovement.startMovement();

      // Executar notificação de início de rota
      await testNotifications[0].action();
      
      console.log('✅ Teste completo - Rota iniciada com mapa e movimento simulado');
      alert('✅ Rota iniciada!\n\n📍 Fase 1: Motorista → Casa do Aluno\n🗺️ Vá para o painel do responsável para ver o trajeto em tempo real.');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar teste:', error);
      alert('❌ Erro ao iniciar teste. Verifique o console para detalhes.');
    }
  };

  const handleEndRouteWithMap = async () => {
    // Parar movimento simulado
    mockDriverMovement.stopMovement();

    // Executar notificação de fim de rota
    await testNotifications[8].action();
    
    console.log('🗺️ Rota finalizada e movimento parado');
    alert('🏁 Rota finalizada!\n\n🔴 O mapa será fechado automaticamente no painel do responsável\n📍 Localização em tempo real encerrada');
  };

  const handleDebugStatus = () => {
    const activeRoute = localStorage.getItem('activeRoute');
    const students = localStorage.getItem('students');
    const driverData = localStorage.getItem('driverData');
    const guardianData = localStorage.getItem('guardianData');

    const debugInfo = {
      activeRoute: activeRoute ? JSON.parse(activeRoute) : null,
      students: students ? JSON.parse(students) : null,
      driverData: driverData ? JSON.parse(driverData) : null,
      guardianData: guardianData ? JSON.parse(guardianData) : null,
      currentGuardianId,
      currentGuardianName
    };

    console.log('🔍 Estado atual do sistema:', debugInfo);
    
    const message = `
🔍 DEBUG - Estado do Sistema:

📍 Rota Ativa: ${activeRoute ? '✅ SIM' : '❌ NÃO'}
👥 Estudantes: ${students ? JSON.parse(students).length : 0}
🚗 Motorista: ${driverData ? '✅ SIM' : '❌ NÃO'}
👤 Responsável: ${guardianData ? '✅ SIM' : '❌ NÃO'}

Veja o console para detalhes completos.
    `;
    
    alert(message);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🧪 Teste de Notificações</h3>
      
      {/* Informações do responsável atual */}
      <div className="mb-4 p-3 bg-white rounded-lg border">
        <h4 className="font-medium text-sm mb-2">👤 Responsável Atual:</h4>
        <p className="text-sm text-gray-700">
          <strong>Nome:</strong> {currentGuardianName}
        </p>
        <p className="text-sm text-gray-700">
          <strong>ID:</strong> {currentGuardianId}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          As notificações serão salvas apenas para este responsável
        </p>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Clique nos botões abaixo para simular eventos da rota e ver as notificações em tempo real:
      </p>
      
      <div className="grid grid-cols-1 gap-2">
        {testNotifications.map((test, index) => (
          <Button
            key={index}
            onClick={test.action}
            variant="outline"
            size="sm"
            className="justify-start text-left"
          >
            {test.label}
          </Button>
        ))}
      </div>
      
      <div className="mt-4 space-y-2">
        <Button
          onClick={handleTestSound}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          🔊 Testar Som
        </Button>
        
        <Button
          onClick={handleClearNotifications}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          🗑️ Limpar Minhas Notificações
        </Button>
        
        <Button
          onClick={handleClearAllUsersNotifications}
          variant="destructive"
          size="sm"
          className="w-full opacity-50"
        >
          ⚠️ Limpar Todas as Notificações (Admin)
        </Button>

        <div className="border-t pt-2 mt-2">
          <p className="text-xs text-gray-600 mb-2 font-medium">🗺️ Teste de Rastreamento:</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              onClick={handleStartRouteWithMap}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              🚀 Iniciar Rota + Mapa
            </Button>
            <Button
              onClick={handleEndRouteWithMap}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              🏁 Finalizar Rota + Mapa
            </Button>
          </div>
          <Button
            onClick={handleDebugStatus}
            variant="secondary"
            size="sm"
            className="w-full text-xs mb-2"
          >
            🔍 Debug - Ver Estado do Sistema
          </Button>
          
          <div className="text-xs text-center p-2 bg-green-50 rounded border">
            <p className="font-semibold text-green-700 mb-1">🗺️ Trajeto Dinâmico</p>
            <p className="text-green-600">Casa → Escola com transições automáticas</p>
          </div>
          
          <div className="border-t pt-2 mt-2">
            <p className="text-xs text-gray-600 mb-2 font-medium">🎭 Simular Fases da Rota:</p>
            <div className="grid grid-cols-1 gap-1">
              <Button
                onClick={async () => {
                  await testNotifications[2].action(); // Embarcar
                  alert('🚌 Aluno embarcou!\n📍 Fase 2: Motorista → Escola');
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🚌 Simular Embarque (Casa → Escola)
              </Button>
              <Button
                onClick={async () => {
                  await testNotifications[4].action(); // Desembarcar na escola
                  alert('🏫 Aluno desembarcou na escola!');
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🏫 Simular Desembarque (Escola)
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Dica:</strong> Abra o painel do responsável em outra aba para ver as notificações chegando em tempo real com som!
          </p>
        </div>
        
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-700">
            ✅ <strong>Novo:</strong> Agora cada responsável vê apenas suas próprias notificações!
          </p>
        </div>
        
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-700">
            🗺️ <strong>Mapa em Tempo Real:</strong> O mapa mostrará movimento simulado do motorista pelas ruas de São Paulo
          </p>
        </div>
      </div>
    </div>
  );
};