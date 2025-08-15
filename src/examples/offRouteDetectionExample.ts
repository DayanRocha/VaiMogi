/**
 * Exemplo de uso da detecção de desvio de rota e recálculo automático
 * 
 * Este arquivo demonstra como o sistema funciona:
 * 1. Detecção automática quando o motorista sai da rota
 * 2. Recálculo automático da rota usando Mapbox
 * 3. Notificação aos responsáveis sobre a mudança
 * 4. Atualização automática do mapa para os responsáveis
 */

import { realTimeTrackingService } from '../services/realTimeTrackingService';
import { pushNotificationService } from '../services/pushNotificationService';

// Exemplo de configuração do sistema
export const setupOffRouteDetection = () => {
  console.log('🚀 Configurando detecção de desvio de rota...');
  
  // Configurar threshold de desvio (padrão: 100 metros)
  realTimeTrackingService.setOffRouteThreshold(150); // 150 metros
  
  // Configurar intervalo mínimo entre recálculos (padrão: 30 segundos)
  realTimeTrackingService.setMinRecalculationInterval(45); // 45 segundos
  
  console.log('✅ Sistema configurado:');
  console.log(`   - Threshold de desvio: ${realTimeTrackingService.getOffRouteThreshold()}m`);
  console.log(`   - Intervalo mínimo de recálculo: ${realTimeTrackingService.getMinRecalculationInterval()}s`);
};

// Exemplo de simulação de desvio de rota
export const simulateOffRouteScenario = async () => {
  console.log('🎭 Simulando cenário de desvio de rota...');
  
  // Verificar se há rota ativa
  if (!realTimeTrackingService.hasActiveRoute()) {
    console.log('❌ Nenhuma rota ativa encontrada. Inicie uma rota primeiro.');
    return;
  }
  
  // Simular posição do motorista fora da rota
  const offRouteLocation = {
    lat: -23.5505 + 0.01, // Deslocamento significativo
    lng: -46.6333 + 0.01,
    timestamp: new Date().toISOString(),
    accuracy: 10,
    speed: 25 // 25 m/s (90 km/h)
  };
  
  console.log('📍 Simulando motorista fora da rota:', offRouteLocation);
  
  // Simular atualização de localização (para teste)
  // await realTimeTrackingService.updateDriverLocationForTest(offRouteLocation);
  
  // Verificar status após a atualização
  const status = realTimeTrackingService.getOffRouteStatus();
  console.log('📊 Status após simulação:', status);
  
  if (status.isOffRoute) {
    console.log(`🚨 Motorista detectado fora da rota! Distância: ${status.distanceFromRoute || 0}m`);
    
    if (status.lastRecalculation) {
      console.log(`🔄 Rota recalculada em: ${status.lastRecalculation}`);
    }
  }
};

// Exemplo de forçar recálculo manual
export const forceRouteRecalculation = async () => {
  console.log('🔧 Forçando recálculo manual da rota...');
  
  try {
    const success = await realTimeTrackingService.forceRouteRecalculation();
    
    if (success) {
      console.log('✅ Rota recalculada com sucesso!');
    } else {
      console.log('❌ Falha ao recalcular rota.');
    }
  } catch (error) {
    console.error('❌ Erro ao forçar recálculo:', error);
  }
};

// Exemplo de monitoramento em tempo real
export const startOffRouteMonitoring = () => {
  console.log('👀 Iniciando monitoramento de desvio de rota...');
  
  // Adicionar listener para atualizações da rota
  realTimeTrackingService.addListener((route) => {
    if (route) {
      const status = realTimeTrackingService.getOffRouteStatus();
      
      if (status.isOffRoute) {
        console.log(`🚨 ALERTA: Motorista fora da rota! Distância: ${status.distanceFromRoute || 0}m`);
        
        // Notificar responsáveis (isso já é feito automaticamente pelo sistema)
        console.log('📱 Responsáveis sendo notificados automaticamente...');
      } else {
        console.log('✅ Motorista na rota correta');
      }
      
      // Log da localização atual
      if (route.currentLocation) {
        console.log(`📍 Localização atual: ${route.currentLocation.lat.toFixed(6)}, ${route.currentLocation.lng.toFixed(6)}`);
      }
      
      // Log de informações da rota
      if (route.mapboxRoute) {
        console.log(`🗺️ Rota ativa: ${route.estimatedDuration || 'N/A'} min, ${route.totalDistance || 'N/A'}m`);
      }
    } else {
      console.log('⏹️ Nenhuma rota ativa');
    }
  });
  
  console.log('✅ Monitoramento iniciado. O sistema irá detectar automaticamente desvios de rota.');
};

// Exemplo de teste de notificações
export const testRouteUpdateNotification = async () => {
  console.log('🔔 Testando notificação de atualização de rota...');
  
  try {
    const success = await pushNotificationService.sendRouteUpdateNotification({
      driverName: 'João Silva',
      reason: 'Rota recalculada devido a desvio detectado',
      newEstimatedTime: '15 minutos'
    });
    
    if (success) {
      console.log('✅ Notificação de teste enviada com sucesso!');
    } else {
      console.log('❌ Falha ao enviar notificação de teste.');
    }
  } catch (error) {
    console.error('❌ Erro ao testar notificação:', error);
  }
};

// Exemplo completo de uso
export const runCompleteExample = async () => {
  console.log('🚀 Executando exemplo completo de detecção de desvio de rota...');
  console.log('=' .repeat(60));
  
  // 1. Configurar sistema
  setupOffRouteDetection();
  
  // 2. Iniciar monitoramento
  startOffRouteMonitoring();
  
  // 3. Testar notificação
  await testRouteUpdateNotification();
  
  // 4. Simular cenário (apenas se houver rota ativa)
  if (realTimeTrackingService.hasActiveRoute()) {
    await simulateOffRouteScenario();
  } else {
    console.log('ℹ️ Para testar a simulação, inicie uma rota primeiro.');
  }
  
  console.log('=' .repeat(60));
  console.log('✅ Exemplo completo executado!');
  console.log('💡 O sistema agora está monitorando automaticamente desvios de rota.');
  console.log('💡 Quando o motorista sair da rota:');
  console.log('   1. O sistema detectará automaticamente');
  console.log('   2. A rota será recalculada usando Mapbox');
  console.log('   3. Os responsáveis serão notificados');
  console.log('   4. O mapa será atualizado automaticamente');
};

// Exportar todas as funções para uso
export default {
  setupOffRouteDetection,
  simulateOffRouteScenario,
  forceRouteRecalculation,
  startOffRouteMonitoring,
  testRouteUpdateNotification,
  runCompleteExample
};