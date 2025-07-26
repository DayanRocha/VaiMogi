# Aplicativo dos Responsáveis - Sistema de Transporte Escolar

## Visão Geral

O aplicativo dos responsáveis permite que pais e responsáveis acompanhem em tempo real a localização da van escolar e recebam notificações sobre o status dos embarques e desembarques de seus filhos.

## Funcionalidades Implementadas

### 🗺️ **Tela Principal com Mapa**
- **Mapa em tempo real**: Ocupa a maior parte da tela
- **Localização da van**: Atualização automática a cada 5 segundos
- **Status dos alunos**: Indicadores visuais de status (aguardando, embarcado, na escola)
- **Botão SOS**: Acesso rápido para emergências
- **Integração Google Maps**: Botão para abrir localização no Google Maps

### 📱 **Header com Navegação**
- **Menu hambúrguer**: Acesso às informações do motorista
- **Saudação personalizada**: "Olá, [Nome]"
- **Ícone de notificações**: Com contador de notificações não lidas
- **Design responsivo**: Otimizado para dispositivos móveis

### 👨‍✈️ **Modal de Informações do Motorista**
- **Foto do motorista**: Imagem de perfil
- **Dados de contato**:
  - Nome completo
  - Telefone (com botão para ligar)
  - Email (com botão para enviar email)
  - Endereço
- **Informações da van**:
  - Foto da van
  - Modelo e placa
  - Capacidade
  - Observações
- **Informações de emergência**: Orientações para situações críticas

### 🔔 **Painel de Notificações**
- **Notificações em tempo real**: Atualizações automáticas
- **Tipos de notificação**:
  - 🚐 Van chegou no ponto
  - 👤 Aluno embarcou
  - 🏫 Aluno chegou na escola
  - 🏠 Aluno foi desembarcado em casa
- **Indicadores visuais**: Cores e ícones específicos por tipo
- **Localização**: Link para ver no Google Maps
- **Marcação como lida**: Individual ou em lote
- **Histórico**: Notificações anteriores organizadas

## Estrutura Técnica

### 📁 **Arquivos Criados**

#### **Páginas**
- `src/pages/GuardianApp.tsx` - Aplicação principal dos responsáveis

#### **Componentes**
- `src/components/GuardianHeader.tsx` - Header com menu e notificações
- `src/components/GuardianMapView.tsx` - Visualização do mapa
- `src/components/DriverInfoModal.tsx` - Modal com dados do motorista
- `src/components/NotificationPanel.tsx` - Painel de notificações
- `src/components/AppSelector.tsx` - Seletor de aplicação (desenvolvimento)

#### **Hooks**
- `src/hooks/useGuardianData.ts` - Gerenciamento de dados dos responsáveis

### 🔧 **Funcionalidades Técnicas**

#### **Simulação de Tempo Real**
- Localização da van atualizada a cada 5 segundos
- Novas notificações geradas automaticamente
- Status dos alunos simulado dinamicamente

#### **Gerenciamento de Estado**
- Hook customizado para dados dos responsáveis
- Estado local para modais e painéis
- Persistência de notificações lidas

#### **Integração Externa**
- Links para Google Maps com coordenadas
- Integração com telefone (`tel:`)
- Integração com email (`mailto:`)

## Interface do Usuário

### 🎨 **Design System**
- **Cores principais**: Azul, verde, laranja, vermelho
- **Tipografia**: Hierarquia clara com títulos e subtítulos
- **Espaçamento**: Consistente com o design existente
- **Responsividade**: Otimizado para mobile-first

### 📱 **Componentes UI**
- **Cards informativos**: Status da rota e alunos
- **Botões de ação**: Ligar, email, ver no maps
- **Indicadores de status**: Pontos coloridos animados
- **Badges de notificação**: Contador visual
- **Modais responsivos**: Informações detalhadas

## Fluxo de Uso

### 1. **Tela Principal**
- Responsável abre o aplicativo
- Vê o mapa com localização da van
- Acompanha status dos filhos
- Recebe notificações em tempo real

### 2. **Informações do Motorista**
- Clica no menu hambúrguer
- Visualiza dados completos do motorista
- Pode ligar ou enviar email
- Vê informações da van

### 3. **Notificações**
- Clica no ícone de notificação
- Vê todas as atualizações
- Pode marcar como lida
- Acessa localização no mapa

## Dados Mock

### **Responsável**
```typescript
{
  id: '1',
  name: 'Maria Silva',
  email: 'maria.silva@email.com',
  phone: '(11) 98765-4321',
  uniqueCode: 'MS2024',
  isActive: true
}
```

### **Notificações**
- Van chegou no ponto
- Aluno embarcou
- Aluno chegou na escola
- Aluno desembarcou em casa

## Navegação

### **Rotas Implementadas**
- `/guardian` - Aplicação dos responsáveis
- `/` - Aplicação do motorista (existente)
- `/auth` - Autenticação (existente)

### **Seletor de Aplicação**
- Botão flutuante para alternar entre aplicações
- Facilita desenvolvimento e testes
- Pode ser removido em produção

## Próximos Passos

### **Melhorias Sugeridas**
1. **Mapa Real**: Integração com Google Maps API
2. **Push Notifications**: Notificações nativas do dispositivo
3. **Chat**: Comunicação direta com motorista
4. **Histórico**: Relatórios de viagens anteriores
5. **Configurações**: Preferências de notificação
6. **Múltiplos Filhos**: Suporte para vários alunos

### **Integrações Futuras**
- WebSocket para atualizações em tempo real
- Geolocalização precisa do motorista
- Sistema de autenticação completo
- Base de dados real (Supabase)
- Notificações push nativas

---

**Status**: ✅ Implementado e funcional  
**Acesso**: `http://localhost:8080/guardian`  
**Compatibilidade**: Mobile-first, responsivo