# Detecção de Desvio de Rota e Recálculo Automático

## 📋 Visão Geral

O sistema VaiMogi agora possui detecção automática de desvio de rota com recálculo em tempo real usando a API do Mapbox. Quando o motorista sai da rota planejada, o sistema:

1. **Detecta automaticamente** o desvio usando cálculos geoespaciais
2. **Recalcula a rota** automaticamente usando a API do Mapbox
3. **Notifica os responsáveis** sobre a mudança
4. **Atualiza o mapa** em tempo real para todos os usuários

## 🚀 Funcionalidades Implementadas

### ✅ Detecção Automática de Desvio
- Monitoramento contínuo da posição do motorista
- Cálculo da distância até a rota planejada
- Threshold configurável (padrão: 100 metros)
- Algoritmo otimizado usando fórmula de Haversine

### ✅ Recálculo Automático da Rota
- Integração com API do Mapbox Directions
- Recálculo inteligente respeitando intervalo mínimo (padrão: 30 segundos)
- Preservação dos pontos de parada (estudantes e escola)
- Atualização da geometria da rota em tempo real

### ✅ Notificações em Tempo Real
- Notificações push para responsáveis
- Alertas sobre mudanças na rota
- Informações sobre nova estimativa de chegada
- Sistema de notificações toast integrado

### ✅ Atualização Automática do Mapa
- Mapa do responsável atualizado automaticamente
- Visualização da nova rota em tempo real
- Marcadores atualizados com nova posição
- Modo de navegação com seguimento automático

## 🛠️ Como Usar

### Configuração Básica

```typescript
import { realTimeTrackingService } from '@/services/realTimeTrackingService';

// Configurar threshold de desvio (em metros)
realTimeTrackingService.setOffRouteThreshold(150); // 150 metros

// Configurar intervalo mínimo entre recálculos (em segundos)
realTimeTrackingService.setMinRecalculationInterval(45); // 45 segundos
```

### Verificar Status de Desvio

```typescript
// Obter status atual
const status = realTimeTrackingService.getOffRouteStatus();

console.log('Fora da rota:', status.isOffRoute);
console.log('Distância da rota:', status.distance, 'metros');
console.log('Última recalculação:', status.lastRecalculation);
```

### Forçar Recálculo Manual

```typescript
// Forçar recálculo da rota
const success = await realTimeTrackingService.forceRouteRecalculation();

if (success) {
  console.log('Rota recalculada com sucesso!');
}
```

### Monitoramento em Tempo Real

```typescript
// Adicionar listener para atualizações
realTimeTrackingService.addListener((route) => {
  if (route) {
    const status = realTimeTrackingService.getOffRouteStatus();
    
    if (status.isOffRoute) {
      console.log(`Motorista fora da rota! Distância: ${status.distance}m`);
    }
  }
});
```

## 📱 Interface do Usuário

### Para Responsáveis
- **Mapa em tempo real** com posição atual do motorista
- **Notificações automáticas** quando a rota é recalculada
- **Visualização da nova rota** atualizada automaticamente
- **Informações de chegada** com nova estimativa de tempo

### Para Motoristas
- **Detecção transparente** sem interferir na experiência
- **Recálculo automático** da rota quando necessário
- **Navegação contínua** sem interrupções

## 🔧 Configurações Avançadas

### Parâmetros Configuráveis

| Parâmetro | Padrão | Descrição |
|-----------|--------|----------|
| `offRouteThreshold` | 100m | Distância para considerar fora da rota |
| `minRecalculationInterval` | 30s | Intervalo mínimo entre recálculos |

### Métodos Disponíveis

```typescript
// Configuração
realTimeTrackingService.setOffRouteThreshold(meters: number)
realTimeTrackingService.setMinRecalculationInterval(seconds: number)

// Consulta
realTimeTrackingService.getOffRouteThreshold(): number
realTimeTrackingService.getMinRecalculationInterval(): number
realTimeTrackingService.getOffRouteStatus(): OffRouteStatus

// Ações
realTimeTrackingService.forceRouteRecalculation(): Promise<boolean>
```

## 🧪 Testando o Sistema

Use o arquivo de exemplo para testar as funcionalidades:

```typescript
import offRouteExample from '@/examples/offRouteDetectionExample';

// Executar exemplo completo
offRouteExample.runCompleteExample();

// Ou testar funcionalidades específicas
offRouteExample.setupOffRouteDetection();
offRouteExample.startOffRouteMonitoring();
offRouteExample.testRouteUpdateNotification();
```

## 🔄 Fluxo de Funcionamento

1. **Início da Rota**
   - Motorista inicia uma rota no sistema
   - Sistema começa a monitorar posição GPS
   - Rota inicial calculada pelo Mapbox

2. **Monitoramento Contínuo**
   - A cada atualização de localização do motorista
   - Sistema calcula distância até a rota planejada
   - Verifica se está dentro do threshold configurado

3. **Detecção de Desvio**
   - Se distância > threshold configurado
   - Marca como "fora da rota"
   - Verifica se pode recalcular (respeitando intervalo mínimo)

4. **Recálculo Automático**
   - Chama API do Mapbox Directions
   - Calcula nova rota da posição atual até os destinos
   - Atualiza geometria da rota no sistema

5. **Notificação e Atualização**
   - Envia notificação para responsáveis
   - Atualiza mapa em tempo real
   - Calcula nova estimativa de chegada

## 🛡️ Tratamento de Erros

O sistema possui tratamento robusto de erros:

- **Falha na API do Mapbox**: Mantém rota anterior e tenta novamente
- **GPS impreciso**: Filtra posições com baixa precisão
- **Conectividade**: Funciona offline com última rota conhecida
- **Rate limiting**: Respeita limites da API do Mapbox

## 📊 Logs e Monitoramento

O sistema gera logs detalhados para monitoramento:

```
📍 Localização do motorista atualizada
🚨 Motorista detectado fora da rota! Distância: 150m
🔄 Recalculando rota...
✅ Nova rota calculada com sucesso
📱 Notificando responsáveis sobre mudança na rota
🗺️ Mapa atualizado com nova rota
```

## 🔮 Próximas Melhorias

- [ ] Detecção de padrões de desvio frequentes
- [ ] Sugestões de rotas alternativas
- [ ] Histórico de desvios para análise
- [ ] Integração com dados de trânsito em tempo real
- [ ] Otimização baseada em machine learning

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Teste com o arquivo de exemplo
3. Verifique configuração do token Mapbox
4. Consulte a documentação da API do Mapbox

---

**Desenvolvido para VaiMogi** 🚐
*Sistema de rastreamento escolar inteligente*