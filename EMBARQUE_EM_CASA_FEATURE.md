# Funcionalidade: Notificações para Embarque em Casa

## Resumo das Mudanças

Esta implementação adiciona notificações específicas para responsáveis de alunos cadastrados como "embarque em casa" durante a execução de rotas.

## Como Funciona

### Diferenciação de Tipos de Aluno

O sistema agora diferencia entre dois tipos de alunos baseado no campo `direction` do `TripStudent`:

- **Embarque em Casa** (`direction: 'to_school'`): Alunos que são pegos em casa e levados para a escola
- **Desembarque em Casa** (`direction: 'to_home'`): Alunos que são pegos na escola e levados para casa

### Notificações para "Embarque em Casa"

Para alunos cadastrados como "embarque em casa", as seguintes notificações são enviadas:

#### 1. Deslizar para a Esquerda (Van Chegou)
- **Ação**: Atualiza status para `van_arrived`
- **Notificação**: "🚐 A van chegou no ponto de embarque de [Nome do Aluno]. Prepare-se para o embarque!"
- **Feedback Visual**: "Van no ponto!" e "Responsáveis notificados - Van chegou!"

#### 2. Deslizar para a Direita (Aluno Embarcou)
- **Ação**: Atualiza status para `embarked`
- **Notificação**: "🚌 [Nome do Aluno] embarcou na van e está a caminho da escola. Chegada prevista em breve!"
- **Feedback Visual**: "À escola!" e "Aluno embarcado - A caminho da escola!"

### Lógica Preservada

A lógica existente para alunos de "desembarque em casa" permanece inalterada, mantendo a compatibilidade com o sistema atual.

## Arquivos Modificados

### 1. `src/hooks/useDriverData.ts`
- Atualizada a função `updateStudentStatus` para diferenciar notificações baseadas no tipo de aluno
- Mensagens específicas para "embarque em casa" vs "desembarque em casa"

### 2. `src/components/ActiveTrip.tsx`
- Adicionada lógica para identificar alunos de "embarque em casa"
- Atualizados os textos de feedback visual durante o arraste
- Personalizadas as mensagens de confirmação após as ações
- Melhorados os indicadores visuais de fundo durante o swipe

## Correções Implementadas

### Diálogo de Desembarque em Casa
- **Título Corrigido**: Agora mostra "Desembarque em Casa: [Nome do Aluno]" em vez de "Desembarque: [Nome da Escola]"
- **Informações Claras**: Exibe o endereço do aluno e uma nota explicativa de que é desembarque em casa
- **Interface Melhorada**: Ícone de casa e layout mais intuitivo
- **Botão Específico**: "Confirmar Desembarque em Casa" em vez de "Desembarcar Aluno"

### Sincronização de Dados
- **EditInfoPage**: Agora pré-seleciona a opção correta baseada no `dropoffLocation` do aluno
- **RouteSetupPage**: Atualiza o `dropoffLocation` do aluno quando a direção é alterada
- **Função updateStudent**: Modificada para aceitar e atualizar o `dropoffLocation`
- **Consistência**: Garante que a configuração na tela de rota reflita o comportamento real

### Geolocalização Inteligente
- **Van → Casa do Aluno**: Para alunos de "desembarque em casa", a rota vai da localização atual da van até a casa do aluno
- **Van → Escola**: Para alunos de "embarque em casa", a rota vai da localização atual da van até a escola
- **Endereços Cadastrados**: Usa os endereços já cadastrados no sistema como destino
- **Fallback Inteligente**: Se a geolocalização falhar, usa o endereço cadastrado do motorista como origem

### Lógica de Exibição Corrigida
- **Grupos de Escola**: Agora só aparecem quando há alunos que devem ser desembarcados NA ESCOLA
- **Desembarque Individual**: Alunos de "desembarque em casa" aparecem apenas individualmente
- **Interface Limpa**: Remove opções desnecessárias de desembarque em grupo para alunos que vão para casa

### ✅ Solução Melhorada - Tipo por Rota
- **Problema Identificado**: Um aluno pode ter tipos diferentes em rotas diferentes (manhã vs tarde)
- **Nova Estrutura**: Tipo de embarque/desembarque é definido por rota, não por aluno
- **Interface RouteStudent**: Nova estrutura para armazenar tipo específico de cada aluno em cada rota
- **Flexibilidade Total**: Mesmo aluno pode ser "embarque em casa" na rota da manhã e "desembarque em casa" na rota da tarde
- **Compatibilidade**: Mantém compatibilidade com rotas existentes usando fallback para o tipo do aluno
- **Configuração por Rota**: Cada rota define independentemente o tipo de cada aluno

### Dados de Exemplo Atualizados
- **Ana Silva e Bruno Santos**: Configurados como "embarque em casa" (`dropoffLocation: 'school'`)
- **Carla Oliveira**: Configurada como "desembarque em casa" (`dropoffLocation: 'home'`)

## Benefícios

1. **Comunicação Clara**: Responsáveis recebem notificações específicas sobre a chegada da van e embarque do aluno
2. **Experiência Melhorada**: Interface mais intuitiva com feedback visual personalizado
3. **Compatibilidade**: Mantém toda a funcionalidade existente para outros tipos de aluno
4. **Rastreabilidade**: Logs detalhados para debugging e monitoramento
5. **Diálogos Corretos**: Informações precisas sobre onde cada aluno está sendo desembarcado

## Exemplo de Uso

### Embarque em Casa (Ana Silva, Bruno Santos)
1. Motorista inicia uma rota com alunos de "embarque em casa"
2. Clica no ícone do mapa → Rota: Van → Casa do Aluno
3. Ao chegar no ponto, desliza para a esquerda
4. Responsável recebe: "A van chegou no ponto de embarque de João. Prepare-se para o embarque!"
5. Após embarcar, desliza para a direita
6. Responsável recebe: "João embarcou na van e está a caminho da escola!"

### Desembarque em Casa (Carla Oliveira)
1. Aluno já está embarcado na van
2. Clica no ícone do mapa → Rota: Van → Casa do Aluno
3. Clica no aluno para abrir diálogo de desembarque em casa
4. Confirma desembarque na residência
5. Responsável recebe notificação de chegada em casa

## Logs de Console

O sistema agora gera logs específicos para facilitar o debugging:

```
🔔 EMBARQUE EM CASA: Responsáveis de João notificados que a van chegou no ponto de embarque
🚌 EMBARQUE EM CASA: João embarcou na van - Responsáveis notificados que está a caminho da escola
```