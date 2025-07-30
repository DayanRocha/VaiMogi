# 🗺️ Sistema de Rastreamento de Rotas

## 🎯 Objetivo

Implementar visualização em tempo real das rotas no painel do responsável, mostrando:
- Localização atual do motorista
- Progresso da rota
- Status dos estudantes
- Próximo destino

## 🏗️ Arquitetura

### 1. **RouteTrackingService** (`src/services/routeTrackingService.ts`)
- Gerencia estado das rotas ativas
- Rastreia localização do motorista em tempo real
- Atualiza status dos estudantes
- Calcula distâncias e progresso

### 2. **useRouteTracking Hook** (`src/hooks/useRouteTracking.ts`)
- Interface React para o serviço de rastreamento
- Fornece dados da rota ativa para componentes
- Calcula métricas em tempo real

### 3. **GuardianMapView Atualizado**
- Mostra mapa ativo durante rotas
- Exibe informações do motorista e estudantes
- Interface responsiva e informativa

## 🚀 Fluxo de Funcionamento

### Início da Rota:
1. Motorista clica "Iniciar Rota"
2. `notificationService.notifyRouteStarted()` é chamado
3. `routeTrackingService.startRoute()` inicia rastreamento
4. Mapa é ativado no painel do responsável
5. Localização é atualizada a cada 30 segundos

### Durante a Rota:
- Localização do motorista é rastreada automaticamente
- Status dos estudantes é atualizado conforme embarques/desembarques
- Responsável vê progresso em tempo real

### Fim da Rota:
1. Motorista clica "Finalizar Rota"
2. `routeTrackingService.endRoute()` para rastreamento
3. Mapa volta ao estado inativo
4. Dados são limpos após 1 hora

## 📱 Interface do Responsável

### Estado Inativo:
- Ícone de mapa com mensagem "Nenhuma Rota Ativa"
- Explicação sobre quando o mapa será ativado

### Estado Ativo:
- Informações da rota (direção, tempo decorrido)
- Barra de progresso
- Localização atual do motorista
- Próximo destino destacado
- Lista de estudantes com status

## 🔧 Recursos Técnicos

- **Geolocalização**: Usa `navigator.geolocation` para rastrear motorista
- **Persistência**: Dados salvos no `localStorage`
- **Tempo Real**: Listeners para atualizações automáticas
- **Cálculos**: Distância entre pontos, progresso da rota
- **Limpeza**: Remoção automática de dados antigos

## 🧪 Como Testar

1. Abra o painel do motorista
2. Abra o painel do responsável em outra aba
3. No painel do motorista, clique "Iniciar Rota"
4. Veja o mapa ativar no painel do responsável
5. Simule eventos (embarque, desembarque)
6. Finalize a rota e veja o mapa desativar

---

**Status**: ✅ Implementado
**Data**: Janeiro 2025