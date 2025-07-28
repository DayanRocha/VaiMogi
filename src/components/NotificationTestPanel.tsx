import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/services/notificationService';
import { audioService } from '@/services/audioService';

export const NotificationTestPanel = () => {
  const [studentName] = useState('Pedro Silva');

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

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🧪 Teste de Notificações</h3>
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
        
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Dica:</strong> Abra o painel do responsável em outra aba para ver as notificações chegando em tempo real com som!
          </p>
        </div>
      </div>
    </div>
  );
};