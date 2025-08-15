# PRD - Product Requirements Document
# VaiMogi - Aplicativo de Transporte Escolar

## 📋 Índice
1. [Visão Geral do Produto](#visão-geral-do-produto)
2. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
3. [Tipos de Usuário](#tipos-de-usuário)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Fluxos de Usuário](#fluxos-de-usuário)
6. [Componentes e Páginas](#componentes-e-páginas)
7. [Serviços e Lógica de Negócio](#serviços-e-lógica-de-negócio)
8. [Requisitos Técnicos](#requisitos-técnicos)
9. [Considerações de UX/UI](#considerações-de-uxui)

---

## 🎯 Visão Geral do Produto

### Propósito
O **VaiMogi** é um aplicativo web desenvolvido para otimizar o transporte escolar, conectando motoristas e responsáveis através de uma plataforma integrada de rastreamento em tempo real, comunicação e gestão de rotas.

### Objetivos Principais
- **Segurança**: Rastreamento em tempo real dos estudantes durante o transporte
- **Comunicação**: Canal direto entre motoristas e responsáveis
- **Eficiência**: Gestão otimizada de rotas, horários e estudantes
- **Transparência**: Visibilidade completa do processo de transporte para os responsáveis

### Proposta de Valor
- Redução da ansiedade dos responsáveis através do acompanhamento em tempo real
- Otimização das rotas e redução de custos operacionais para motoristas
- Melhoria na comunicação e relacionamento entre todas as partes envolvidas
- Histórico completo de viagens para análise e relatórios

---

## 🏗️ Arquitetura e Tecnologias

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **Roteamento**: React Router DOM
- **Estado**: React Query (TanStack Query) + Context API
- **UI Components**: Radix UI + Tailwind CSS + Lucide Icons
- **Mapas**: 
  - Google Maps API (@googlemaps/js-api-loader)
  - Mapbox GL JS
  - Leaflet
  - Mapbox Maki (ícones)
- **Notificações**: Sonner + Canvas Confetti
- **Persistência**: LocalStorage
- **Comunicação**: BroadcastChannel API

### Estrutura de Pastas
```
src/
├── components/          # Componentes reutilizáveis
│   ├── maps/           # Componentes de mapa
│   └── ui/             # Componentes de interface
├── config/             # Configurações
├── hooks/              # Custom hooks
├── lib/                # Utilitários e bibliotecas
├── pages/              # Páginas principais
├── services/           # Serviços e APIs
├── types/              # Definições TypeScript
└── utils/              # Funções utilitárias
```

---

## 👥 Tipos de Usuário

### 1. Motorista (Driver)
**Perfil**: Profissional responsável pelo transporte escolar

**Responsabilidades**:
- Gerenciar dados pessoais e da van
- Cadastrar e gerenciar estudantes, responsáveis e escolas
- Criar e executar rotas
- Monitorar viagens em tempo real
- Comunicar-se com responsáveis
- Gerar códigos únicos de acesso
- Controlar status de acesso dos responsáveis

### 2. Responsável (Guardian)
**Perfil**: Pais ou responsáveis pelos estudantes

**Responsabilidades**:
- Acompanhar localização em tempo real do transporte
- Receber notificações sobre embarque/desembarque
- Visualizar histórico de viagens
- Comunicar-se com o motorista
- Acessar informações da rota

---

## 🚀 Funcionalidades Principais

### Para Motoristas

#### 1. Gestão de Cadastros
- **Estudantes**: Nome, escola, responsável, endereço, observações
- **Responsáveis**: Nome, email, telefone, código único
- **Escolas**: Nome, endereço, horários
- **Van**: Modelo, placa, capacidade, foto, autorização

#### 2. Gestão de Rotas
- **Criação de Rotas**: Definir pontos de parada, ordem, horários
- **Rotas Salvas**: Reutilizar rotas frequentes
- **Execução de Rotas**: Iniciar viagem com rastreamento
- **Histórico**: Visualizar rotas anteriores com detalhes

#### 3. Rastreamento em Tempo Real
- **GPS**: Localização precisa da van
- **Status de Estudantes**: Embarque/desembarque com swipe
- **Notificações Automáticas**: Alertas para responsáveis
- **Desvios de Rota**: Detecção e recálculo automático

#### 4. Comunicação
- **Notificações Push**: Alertas em tempo real
- **Códigos Únicos**: Geração para acesso dos responsáveis
- **Status de Acesso**: Ativar/desativar responsáveis

#### 5. Configurações e Relatórios
- **Configurações de Desvio**: Tolerância, recálculo automático
- **Histórico Detalhado**: Relatórios de viagens
- **Backup de Dados**: Exportação de informações

### Para Responsáveis

#### 1. Rastreamento
- **Mapa em Tempo Real**: Visualização da localização da van
- **Status do Estudante**: Embarcado/desembarcado
- **ETA**: Tempo estimado de chegada

#### 2. Notificações
- **Embarque/Desembarque**: Confirmações automáticas
- **Atrasos**: Alertas de mudanças na rota
- **Emergências**: Notificações críticas

#### 3. Histórico
- **Viagens Anteriores**: Registro completo
- **Horários**: Padrões de embarque/desembarque

---

## 🔄 Fluxos de Usuário

### Fluxo do Motorista

#### 1. Onboarding
1. **Registro**: Email, senha, dados pessoais
2. **Configuração Inicial**: Cadastro da van
3. **Welcome Dialog**: Apresentação do app
4. **Primeiro Cadastro**: Estudantes e responsáveis

#### 2. Operação Diária
1. **Login**: Autenticação
2. **Dashboard**: Visão geral das atividades
3. **Seleção de Rota**: Escolher rota salva ou criar nova
4. **Preparação**: Adicionar/remover estudantes
5. **Execução**: Iniciar rastreamento
6. **Monitoramento**: Acompanhar progresso
7. **Finalização**: Encerrar viagem

#### 3. Gestão
1. **Cadastros**: Manter dados atualizados
2. **Códigos**: Gerar/renovar códigos de acesso
3. **Status**: Gerenciar acesso dos responsáveis
4. **Relatórios**: Analisar histórico

### Fluxo do Responsável

#### 1. Acesso
1. **Código Único**: Inserir código fornecido pelo motorista
2. **Validação**: Verificar status ativo
3. **Dashboard**: Acesso ao mapa e informações

#### 2. Acompanhamento
1. **Mapa**: Visualizar localização em tempo real
2. **Status**: Verificar se o estudante embarcou
3. **Notificações**: Receber alertas automáticos
4. **Histórico**: Consultar viagens anteriores

---

## 📱 Componentes e Páginas

### Páginas Principais

#### Motorista (DriverApp)
- **Dashboard**: Visão geral e navegação
- **Cadastros**: Estudantes, responsáveis, escolas, van
- **Rotas**: Criação, execução, histórico
- **Configurações**: Códigos, status, preferências
- **Relatórios**: Histórico detalhado

#### Responsável (GuardianApp)
- **Mapa**: Rastreamento em tempo real
- **Notificações**: Central de alertas
- **Perfil**: Informações pessoais

#### Autenticação (AuthFlow)
- **Login**: Motorista (email/senha) e Responsável (código)
- **Registro**: Apenas para motoristas
- **Recuperação**: Reset de senha

### Componentes de Mapa
- **GuardianRealTimeMap**: Mapa para responsáveis
- **RouteTrackingMap**: Mapa de execução de rota
- **LeafletMap**: Implementação com Leaflet
- **CleanDynamicMap**: Mapa limpo e responsivo
- **StaticMap**: Visualização estática

### Componentes de Interface
- **BottomNavigation**: Navegação inferior
- **NotificationPanel**: Central de notificações
- **GuardianHeader**: Cabeçalho do responsável
- **WelcomeDialog**: Boas-vindas
- **Formulários**: Cadastros diversos

---

## ⚙️ Serviços e Lógica de Negócio

### Serviços Principais

#### 1. routeTrackingService
- **Rastreamento GPS**: Localização em tempo real
- **Persistência**: Dados no localStorage
- **Limpeza**: Remoção de rotas antigas
- **Singleton**: Instância única global

#### 2. notificationService
- **Gerenciamento**: CRUD de notificações
- **Persistência**: localStorage
- **Polling**: Atualizações em tempo real
- **Tipos**: Embarque, desembarque, alertas

#### 3. realTimeNotificationService
- **BroadcastChannel**: Comunicação entre abas
- **Eventos**: Storage events para sincronização
- **Distribuição**: Notificações para múltiplas instâncias

#### 4. routeHistoryService
- **Histórico**: Armazenamento de viagens
- **Filtros**: Por data, período, status
- **Relatórios**: Geração de dados analíticos

### Custom Hooks

#### 1. useDriverData
- **Estado Global**: Dados do motorista
- **Persistência**: Sincronização com localStorage
- **CRUD**: Operações de cadastro

#### 2. useGuardianData
- **Autenticação**: Validação de código
- **Dados**: Informações do responsável
- **Motorista**: Dados do motorista associado

#### 3. useRealTimeNotifications
- **Consumo**: Serviço de notificações
- **Interface**: Exibição na UI
- **Sons**: Alertas sonoros
- **Browser**: Notificações nativas

#### 4. useRouteTracking
- **Estado**: Rota ativa
- **Persistência**: localStorage
- **Sincronização**: Restauração de estado

---

## 📋 Requisitos Técnicos

### Funcionais
1. **Rastreamento GPS** com precisão de 5 metros
2. **Notificações em tempo real** com latência < 5 segundos
3. **Persistência offline** de dados críticos
4. **Sincronização** entre múltiplas abas/dispositivos
5. **Histórico** de pelo menos 30 dias
6. **Códigos únicos** com 8 caracteres alfanuméricos
7. **Mapas múltiplos** (Google, Mapbox, Leaflet)
8. **Responsividade** para dispositivos móveis

### Não Funcionais
1. **Performance**: Carregamento < 3 segundos
2. **Disponibilidade**: 99.9% uptime
3. **Segurança**: Dados criptografados no localStorage
4. **Usabilidade**: Interface intuitiva e acessível
5. **Escalabilidade**: Suporte a múltiplos motoristas
6. **Compatibilidade**: Navegadores modernos
7. **Offline**: Funcionalidade básica sem internet

### Limitações Técnicas
1. **Armazenamento**: localStorage (5-10MB por domínio)
2. **Tempo Real**: Dependente de polling (não WebSocket)
3. **GPS**: Precisão limitada pelo dispositivo
4. **Notificações**: Requer permissão do usuário
5. **Mapas**: Dependente de APIs externas

---

## 🎨 Considerações de UX/UI

### Design System
- **Cores Primárias**: Laranja (#F97316) e tons de cinza
- **Tipografia**: Sistema padrão com hierarquia clara
- **Ícones**: Lucide React (consistência visual)
- **Componentes**: Radix UI (acessibilidade)
- **Layout**: Mobile-first, responsivo

### Princípios de UX
1. **Simplicidade**: Interface limpa e objetiva
2. **Feedback**: Confirmações visuais para todas as ações
3. **Consistência**: Padrões visuais e comportamentais
4. **Acessibilidade**: Suporte a leitores de tela
5. **Performance**: Carregamento otimizado
6. **Offline**: Graceful degradation

### Fluxos Críticos
1. **Onboarding**: Processo guiado para novos usuários
2. **Rastreamento**: Informações claras e em tempo real
3. **Notificações**: Alertas não intrusivos mas visíveis
4. **Emergência**: Acesso rápido a informações críticas

### Responsividade
- **Mobile**: 320px - 768px (foco principal)
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+ (funcionalidade completa)

---

## 📊 Métricas e KPIs

### Métricas de Uso
- **DAU/MAU**: Usuários ativos diários/mensais
- **Tempo de Sessão**: Duração média de uso
- **Rotas Executadas**: Número de viagens por dia
- **Notificações Enviadas**: Volume de comunicação

### Métricas de Performance
- **Tempo de Carregamento**: < 3 segundos
- **Precisão GPS**: Margem de erro < 5 metros
- **Latência de Notificação**: < 5 segundos
- **Taxa de Erro**: < 1% das operações

### Métricas de Satisfação
- **NPS**: Net Promoter Score
- **Taxa de Retenção**: Usuários que retornam
- **Feedback**: Avaliações e comentários
- **Suporte**: Tickets de ajuda

---

## 🔮 Roadmap e Melhorias Futuras

### Curto Prazo (1-3 meses)
1. **WebSocket**: Comunicação em tempo real
2. **PWA**: Instalação como app nativo
3. **Notificações Push**: Alertas mesmo com app fechado
4. **Backup Cloud**: Sincronização de dados

### Médio Prazo (3-6 meses)
1. **API Backend**: Migração do localStorage
2. **Multi-tenant**: Suporte a múltiplas empresas
3. **Relatórios Avançados**: Analytics e insights
4. **Integração Escolar**: APIs de sistemas escolares

### Longo Prazo (6+ meses)
1. **IA/ML**: Otimização automática de rotas
2. **IoT**: Integração com sensores da van
3. **Pagamentos**: Sistema de cobrança integrado
4. **Marketplace**: Plataforma para múltiplos motoristas

---

## 📝 Conclusão

O **VaiMogi** representa uma solução completa e moderna para o transporte escolar, combinando tecnologias web avançadas com uma experiência de usuário intuitiva. A arquitetura atual suporta as necessidades básicas do mercado, enquanto o roadmap futuro posiciona o produto para crescimento e expansão.

A análise completa revela um sistema bem estruturado, com separação clara de responsabilidades, código modular e foco na experiência do usuário. As principais oportunidades de melhoria estão na migração para uma arquitetura backend robusta e na implementação de funcionalidades avançadas de tempo real.

**Data de Criação**: Janeiro 2025  
**Versão**: 1.0  
**Status**: Análise Completa Finalizada