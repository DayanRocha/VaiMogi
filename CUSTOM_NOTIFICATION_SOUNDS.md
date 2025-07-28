# Sistema de Sons Personalizados para Notificações

## 🎵 Visão Geral

O sistema agora suporta sons personalizados para cada tipo de notificação, permitindo que os responsáveis carreguem seus próprios arquivos de áudio para uma experiência mais personalizada.

## 🔧 Funcionalidades Implementadas

### 1. **Carregamento de Arquivos de Áudio**
- Upload de arquivos MP3, WAV, OGG, M4A, AAC
- Validação de formato e tamanho (máximo 5MB)
- Armazenamento local no navegador

### 2. **Gerenciamento por Tipo de Notificação**
- **🚀 Início da Rota** - Som quando a rota é iniciada
- **🚐 Van Chegou** - Som quando a van chega no ponto
- **👤 Embarque** - Som quando o aluno embarca
- **🏫 Na Escola** - Som quando chega na escola
- **🚪 Desembarque** - Som quando o aluno desembarca
- **🏁 Fim da Rota** - Som quando a rota é finalizada

### 3. **Controles Avançados**
- Ativar/desativar sons personalizados
- Testar cada som individualmente
- Remover sons personalizados
- Fallback automático para sons gerados

## 📱 Como Usar

### Passo 1: Acessar Configurações
1. Abra o painel do responsável
2. Clique no menu (ícone de hambúrguer)
3. Vá na aba "Config"
4. Localize "Sons de Notificação"

### Passo 2: Ativar Sons Personalizados
1. Certifique-se que "Ativar sons" está ligado
2. Ative "Sons personalizados"
3. O gerenciador de sons aparecerá

### Passo 3: Carregar Arquivos de Áudio
1. Para cada tipo de notificação:
   - Clique no botão de upload (📤)
   - Selecione um arquivo de áudio
   - Aguarde o carregamento
2. Use o botão play (▶️) para testar
3. Use o botão lixeira (🗑️) para remover

## 🎧 Especificações Técnicas

### Formatos Suportados
```
✅ MP3 (recomendado)
✅ WAV (alta qualidade)
✅ OGG (código aberto)
✅ M4A (Apple)
✅ AAC (comprimido)
```

### Limitações
- **Tamanho máximo**: 5MB por arquivo
- **Duração recomendada**: 1-3 segundos
- **Armazenamento**: Local no navegador (localStorage)

### Qualidade Recomendada
- **MP3**: 128-320 kbps
- **WAV**: 44.1kHz, 16-bit
- **Duração**: Curta e clara
- **Volume**: Moderado (será ajustado automaticamente)

## 🏗️ Arquitetura Técnica

### AudioService Atualizado
```typescript
class AudioService {
  // Novos métodos para sons personalizados
  async loadCustomSound(type: NotificationSoundType, audioFile: File): Promise<boolean>
  removeCustomSound(type: NotificationSoundType)
  hasCustomSound(type: NotificationSoundType): boolean
  setUseCustomSounds(use: boolean)
  
  // Reprodução inteligente
  async playNotificationSound(type: NotificationSoundType) {
    // 1. Tentar som personalizado primeiro
    if (this.useCustomSounds && await this.playCustomSound(type)) {
      return;
    }
    
    // 2. Fallback para som gerado
    // ... tons gerados por Web Audio API
  }
}
```

### Persistência de Dados
```typescript
// Configurações salvas no localStorage
{
  "customNotificationSounds": {
    "route_started": "blob:http://localhost:3000/audio-url-1",
    "van_arrived": "blob:http://localhost:3000/audio-url-2"
  },
  "useCustomNotificationSounds": "true",
  "notificationSoundsEnabled": "true"
}
```

### Componentes Criados
- `CustomSoundManager.tsx` - Interface de gerenciamento
- `AudioSettingsPanel.tsx` - Configurações gerais (atualizado)
- Integração com `GuardianMenuModal.tsx`

## 🧪 Como Testar

### Teste Completo do Sistema
1. **Preparar arquivos de áudio**:
   - Baixe ou crie arquivos de áudio curtos (1-3 segundos)
   - Formatos: MP3, WAV, etc.
   - Nomeie de forma descritiva (ex: "van-chegou.mp3")

2. **Configurar no painel**:
   - Acesse painel do responsável
   - Vá em Config → Sons de Notificação
   - Ative sons personalizados
   - Carregue um arquivo para cada tipo

3. **Testar reprodução**:
   - Use os botões de play para testar cada som
   - Verifique se o volume está adequado

4. **Testar em cenário real**:
   - Abra painel do motorista em outra aba
   - Execute ações da rota (swipes, etc.)
   - Verifique se os sons personalizados tocam no painel do responsável

### Teste de Fallback
1. Carregue apenas alguns sons personalizados
2. Execute rota completa
3. Verifique que:
   - Sons personalizados tocam quando disponíveis
   - Sons gerados tocam quando não há personalizado

## 🎨 Sugestões de Sons

### Sons Adequados por Tipo

**🚀 Início da Rota**
- Som de motor ligando
- Campainha suave ascendente
- Música de início alegre

**🚐 Van Chegou**
- Buzina curta e amigável
- Sino de chegada
- "Ding dong" suave

**👤 Embarque**
- Som de porta fechando
- "Ding" de confirmação
- Tom único prolongado

**🏫 Na Escola**
- Sino escolar tradicional
- Música alegre e curta
- Sons de crianças brincando (baixo)

**🚪 Desembarque**
- Som de conclusão ("ta-da")
- Campainha descendente
- Tom de finalização

**🏁 Fim da Rota**
- Sequência musical completa
- Fanfarra curta
- Som de sucesso/conquista

### Onde Encontrar Sons
- **Freesound.org** - Sons gratuitos com licença Creative Commons
- **Zapsplat.com** - Biblioteca de efeitos sonoros
- **YouTube Audio Library** - Sons livres de direitos
- **Criar próprios** - Gravar com smartphone ou microfone

## 🔒 Considerações de Privacidade e Performance

### Armazenamento Local
- Sons são armazenados no navegador (não enviados para servidor)
- Dados permanecem no dispositivo do usuário
- Limpeza automática se arquivo corrompido

### Performance
- Arquivos são carregados uma vez e reutilizados
- Pré-carregamento para reprodução instantânea
- Liberação de memória quando removidos

### Compatibilidade
- Funciona em navegadores modernos
- Fallback para sons gerados se não suportado
- Detecção automática de capacidades do navegador

## 🚀 Próximas Melhorias Sugeridas

1. **Biblioteca de Sons Pré-definidos**
   - Coleção de sons profissionais incluídos
   - Temas (clássico, moderno, infantil)

2. **Editor de Áudio Básico**
   - Cortar duração do som
   - Ajustar volume
   - Fade in/out

3. **Sincronização na Nuvem**
   - Backup dos sons personalizados
   - Sincronização entre dispositivos

4. **Sons por Aluno**
   - Som personalizado para cada filho
   - Reconhecimento por voz

5. **Configurações Avançadas**
   - Horários para silenciar
   - Volume por tipo de notificação
   - Vibração em dispositivos móveis

---

**Implementado**: Janeiro 2025  
**Versão**: 2.1  
**Status**: ✅ Funcional com sons personalizados  
**Compatibilidade**: Navegadores modernos com suporte a Web Audio API