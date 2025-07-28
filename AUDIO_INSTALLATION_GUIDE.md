# Guia de Instalação dos Sons de Notificação

## 🎵 Visão Geral

O sistema agora usa arquivos de áudio fixos que ficam na pasta `public/sounds/` do projeto. Estes sons são carregados automaticamente quando a aplicação inicia e ficam disponíveis para todos os responsáveis.

## 📁 Estrutura de Arquivos

```
public/
└── sounds/
    ├── route-started.mp3    # Som de início da rota
    ├── van-arrived.mp3      # Som de chegada da van
    ├── embarked.mp3         # Som de embarque
    ├── at-school.mp3        # Som de chegada na escola
    ├── disembarked.mp3      # Som de desembarque
    ├── route-finished.mp3   # Som de fim da rota
    ├── default.mp3          # Som padrão (fallback)
    └── README.md            # Documentação
```

## 🔧 Como Instalar os Sons

### Passo 1: Obter Arquivos de Áudio
1. **Baixe ou crie** arquivos de áudio nos formatos suportados (MP3, WAV, OGG)
2. **Duração recomendada**: 1-3 segundos cada
3. **Qualidade**: MP3 128-192 kbps ou WAV 44.1kHz 16-bit

### Passo 2: Nomear Corretamente
Os arquivos devem ter **exatamente** estes nomes:
- `route-started.mp3`
- `van-arrived.mp3`
- `embarked.mp3`
- `at-school.mp3`
- `disembarked.mp3`
- `route-finished.mp3`
- `default.mp3`

### Passo 3: Substituir Placeholders
1. Navegue até a pasta `public/sounds/`
2. **Substitua** os arquivos placeholder pelos arquivos MP3 reais
3. **Mantenha os nomes exatos** dos arquivos

### Passo 4: Testar
1. **Reinicie** a aplicação de desenvolvimento (`npm run dev`)
2. **Acesse** o painel do responsável
3. **Vá em** Menu → Config → Sons de Notificação
4. **Ative** "Sons de alta qualidade"
5. **Teste** cada som com o botão "Testar Som"

## 🎨 Sugestões de Sons

### 🚀 Início da Rota (route-started.mp3)
**Características**: Motivacional, ascendente, energético
- Som de motor ligando suavemente
- Campainha ascendente (Dó → Mi → Sol)
- Música de início curta e alegre
- Efeito de "partida" ou "início de jornada"

### 🚐 Van Chegou (van-arrived.mp3)
**Características**: Alerta amigável, chamativo mas não agressivo
- Buzina curta e amigável (2 toques)
- Sino de chegada
- "Ding dong" clássico
- Som de campainha de porta

### 👤 Embarque (embarked.mp3)
**Características**: Confirmação, positivo, curto
- "Ding" de confirmação
- Som de porta fechando suavemente
- Tom único e claro
- Efeito de "check" ou "ok"

### 🏫 Na Escola (at-school.mp3)
**Características**: Escolar, alegre, educativo
- Sino escolar tradicional
- Música infantil alegre (muito curta)
- Sons de ambiente escolar (crianças brincando - baixo)
- Campainha de escola

### 🚪 Desembarque (disembarked.mp3)
**Características**: Conclusão, satisfação, finalização
- Som de conclusão "ta-da"
- Campainha descendente (Sol → Mi → Dó)
- Tom de finalização positivo
- Efeito de "missão cumprida"

### 🏁 Fim da Rota (route-finished.mp3)
**Características**: Celebração, sucesso, completude
- Fanfarra curta de sucesso
- Sequência musical completa (2-4 segundos)
- Som de conquista/vitória
- Música de finalização épica (curta)

### 🔔 Padrão (default.mp3)
**Características**: Neutro, agradável, versátil
- Som de notificação genérico
- Tom neutro e limpo
- Usado quando outros sons falham
- Simples e eficaz

## 🌐 Recursos para Encontrar Sons

### Sites Gratuitos:
1. **Freesound.org**
   - Busque: "notification", "bell", "chime"
   - Licença: Creative Commons
   - Qualidade: Variada

2. **Zapsplat.com**
   - Biblioteca profissional
   - Cadastro gratuito
   - Alta qualidade

3. **YouTube Audio Library**
   - Sons livres de direitos
   - Boa variedade
   - Download direto

4. **Pixabay**
   - Sons e música gratuitos
   - Sem necessidade de atribuição
   - Interface simples

### Ferramentas de Edição:
- **Audacity** (gratuito) - Editar, cortar, normalizar
- **GarageBand** (Mac) - Criar e editar
- **Online Audio Cutter** - Edição web simples

## ⚙️ Configurações Técnicas

### Formato Recomendado: MP3
```
Bitrate: 128-192 kbps
Sample Rate: 44.1 kHz
Channels: Mono ou Stereo
Duration: 1-3 segundos
File Size: < 500KB cada
```

### Normalização de Volume:
- Use ferramentas para normalizar o volume
- Evite sons muito altos ou muito baixos
- Teste em diferentes dispositivos

## 🧪 Processo de Teste

### Teste Individual:
1. Substitua um arquivo por vez
2. Recarregue a aplicação
3. Teste o som específico
4. Ajuste se necessário

### Teste Completo:
1. Substitua todos os arquivos
2. Reinicie a aplicação
3. Execute uma rota completa:
   - Inicie rota → Ouça som de início
   - Van chegou → Ouça som de chegada
   - Embarque → Ouça som de embarque
   - Na escola → Ouça som de escola
   - Desembarque → Ouça som de desembarque
   - Fim da rota → Ouça som de finalização

### Teste de Fallback:
1. Renomeie um arquivo temporariamente
2. Teste se o som gerado (tons) funciona
3. Restaure o arquivo original

## 🚨 Solução de Problemas

### Som não toca:
- ✅ Verifique se o arquivo existe
- ✅ Confirme o nome exato do arquivo
- ✅ Teste o formato (MP3 recomendado)
- ✅ Verifique permissões de áudio no navegador
- ✅ Limpe o cache do navegador

### Som muito baixo/alto:
- 🔧 Use Audacity para normalizar
- 🔧 Ajuste o volume no código (audioService.ts)
- 🔧 Teste em diferentes dispositivos

### Som não carrega:
- 🔍 Verifique o console do navegador (F12)
- 🔍 Confirme o caminho do arquivo
- 🔍 Teste com arquivo menor
- 🔍 Tente formato diferente

## 📊 Monitoramento

### Logs do Sistema:
O sistema gera logs no console para debug:
```
✅ Arquivo de áudio carregado: /sounds/route-started.mp3
🔊 Arquivo de áudio reproduzido para route_started
⚠️ Erro ao carregar arquivo de áudio para van_arrived
```

### Verificação de Status:
No painel do responsável, você pode ver:
- Quantos arquivos foram carregados
- Se está usando arquivos ou tons gerados
- Status de cada reprodução

## 🔄 Atualizações Futuras

Para adicionar novos tipos de som:
1. Adicione o arquivo na pasta `public/sounds/`
2. Atualize o mapeamento em `audioService.ts`
3. Adicione o tipo em `NotificationSoundType`
4. Teste a integração

---

**Criado**: Janeiro 2025  
**Versão**: 2.0  
**Compatibilidade**: Navegadores modernos com Web Audio API