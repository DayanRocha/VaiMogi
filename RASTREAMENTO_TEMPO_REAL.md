# Sistema de Rastreamento em Tempo Real

Este documento descreve como configurar e usar o sistema de rastreamento em tempo real implementado no VaiMogi.

## 🚀 Funcionalidades Implementadas

### Para o Motorista:
- **Iniciar Rastreamento**: Ao clicar em "Iniciar Rota", o sistema automaticamente inicia o rastreamento GPS
- **Indicador Visual**: Mostra quando o rastreamento está ativo na tela de execução da rota
- **Parar Rastreamento**: Botão para parar o rastreamento manualmente ou automaticamente ao encerrar a rota
- **Persistência**: O rastreamento continua mesmo se o app for fechado ou recarregado

### Para o Responsável:
- **🧭 Modo Navegação Automático**: Quando o motorista inicia uma rota, o mapa entra automaticamente no modo navegação
- **Seguimento Automático**: Câmera do mapa segue automaticamente o motorista em tempo real
- **Marcador Especial**: Marcador do motorista com animação especial no modo navegação
- **Rota Traçada**: Rota otimizada calculada automaticamente usando Mapbox
- **Informações Dinâmicas**: Tempo estimado de chegada e próxima parada
- **Controles de Navegação**: Botões para ativar/desativar seguimento e sair do modo navegação
- **Atualizações Automáticas**: Posição atualizada a cada 5 segundos

## 🛠️ Configuração

### 1. Token do Mapbox

O sistema usa o Mapbox para mapas e cálculo de rotas. Você precisa configurar um token de acesso:

#### Opção A: Variável de Ambiente (Recomendado)
1. Copie o arquivo `.env.example` para `.env`
2. Obtenha um token gratuito em [mapbox.com](https://account.mapbox.com/access-tokens/)
3. Substitua `pk.your_mapbox_token_here` pelo seu token real

#### Opção B: Configuração via Interface
1. No painel do responsável, clique no botão de configurações (⚙️)
2. Cole seu token do Mapbox
3. O sistema validará e salvará automaticamente

### 2. Permissões de Localização

O sistema precisa de permissão para acessar a localização do dispositivo:
- **Web**: O navegador solicitará permissão automaticamente
- **Mobile**: Certifique-se de que as permissões de localização estão habilitadas

## 📱 Como Usar

### Para o Motorista:

1. **Configurar Rota**:
   - Vá para "Suas Rotas" → "+" → Configure a rota
   - Adicione estudantes e escola
   - Salve a rota

2. **Configurar Navegação** (Opcional):
   - Na tela de execução da rota, clique no ícone de navegação (🧭)
   - Ative/desative a navegação automática
   - Escolha suas preferências

3. **Iniciar Rastreamento**:
   - Selecione a rota salva
   - Clique em "Executar rota"
   - Clique em "Iniciar Rota"
   - O rastreamento GPS iniciará automaticamente
   - **🆕 NAVEGAÇÃO AUTOMÁTICA**: O mapa do responsável entrará automaticamente no modo navegação

4. **Durante a Rota**:
   - O indicador "Rastreando" aparecerá no cabeçalho
   - Sua localização será enviada automaticamente
   - Continue executando a rota normalmente

5. **Encerrar Rastreamento**:
   - Clique em "Encerrar Rota" para parar tudo
   - Ou use o botão de parar (⏹️) para parar apenas o rastreamento

### Para o Responsável:

1. **Modo Navegação Automático**:
   - Abra o app do responsável
   - Quando o motorista iniciar uma rota, o mapa automaticamente:
     - Entra no modo navegação
     - Mostra painel laranja com informações da rota
     - Segue automaticamente o motorista
     - Exibe marcador especial com animação

2. **Controles de Navegação**:
   - **📍 Seguindo/Seguir**: Ativa/desativa seguimento automático da câmera
   - **❌ Sair**: Sai do modo navegação (volta ao modo normal)
   - **🧭 Ativar Navegação**: Entra manualmente no modo navegação

3. **Informações em Tempo Real**:
   - Tempo estimado de chegada
   - Próxima parada
   - Rota traçada em laranja no mapa
   - Status de conexão em tempo real

4. **Configurar Mapbox** (se necessário):
   - Clique no botão de configurações (⚙️)
   - Cole seu token do Mapbox
   - Salve para habilitar funcionalidades avançadas

## 🔧 Arquitetura Técnica

### Serviços Principais:

1. **`realTimeTrackingService`**: Gerencia o rastreamento GPS e cálculo de rotas
2. **`navigationService`**: Gerencia abertura de apps de navegação (Google Maps, Waze, Apple Maps)
3. **`useRealTimeTracking`**: Hook React para integração com componentes
4. **`GuardianRealTimeMap`**: Componente de mapa para responsáveis
5. **`NavigationSettings`**: Componente para configurar navegação automática

### Fluxo de Dados:

```
Motorista inicia rota → GPS captura localização → Serviço processa dados → 
LocalStorage persiste → 🧭 Mapa do responsável entra automaticamente no modo navegação → 
Responsável visualiza em tempo real com seguimento automático
```

### Persistência:

- **LocalStorage**: Dados da rota ativa e configurações
- **Limpeza Automática**: Rotas antigas (>4h) são removidas automaticamente
- **Recuperação**: Sistema restaura rastreamento após recarregar página

## 🐛 Solução de Problemas

### Rastreamento não inicia:
- Verifique se a localização está habilitada
- Confirme que há estudantes e escola na rota
- Verifique o console do navegador para erros

### Mapa não carrega:
- Verifique se o token do Mapbox está configurado
- Teste a conectividade com a internet
- Limpe o cache do navegador

### Localização imprecisa:
- Use em ambiente externo para melhor GPS
- Aguarde alguns segundos para estabilizar
- Verifique se o dispositivo tem GPS habilitado

### Performance:
- O sistema atualiza a cada 5 segundos para economizar bateria
- Dados antigos são limpos automaticamente
- Use WiFi quando possível para melhor performance

## 📊 Monitoramento

### Logs do Sistema:
- Abra o console do navegador (F12)
- Procure por mensagens com emojis: 🚀 🗺️ 📍 🛑
- Logs mostram início, atualizações e fim do rastreamento

### Dados Armazenados:
- `realTimeTrackingRoute`: Dados da rota ativa
- `trackingRouteFlag`: Flag de controle
- `mapboxAccessToken`: Token do Mapbox

## 🔒 Privacidade e Segurança

- **Dados Locais**: Todas as informações ficam no dispositivo
- **Sem Servidor**: Não enviamos dados para servidores externos
- **Mapbox**: Usado apenas para mapas e cálculo de rotas
- **Limpeza**: Dados antigos são removidos automaticamente

## 🚀 Próximas Melhorias

- [ ] Notificações push quando motorista se aproxima
- [ ] Histórico de rotas com replay
- [ ] Compartilhamento de localização via WhatsApp
- [ ] Modo offline com mapas em cache
- [ ] Integração com Waze/Google Maps

## 📞 Suporte

Se encontrar problemas:
1. Verifique este documento primeiro
2. Consulte os logs do console
3. Teste com token do Mapbox válido
4. Reporte bugs com detalhes específicos