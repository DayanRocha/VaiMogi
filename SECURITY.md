# 🔒 Guia de Segurança - VaiMogi

## Visão Geral

Este documento descreve as medidas de segurança implementadas no aplicativo VaiMogi e as práticas recomendadas para manter a segurança dos dados.

## 🛡️ Medidas de Segurança Implementadas

### 1. Sanitização de Dados

- **Utilitário de Sanitização**: Criado `src/utils/sanitizer.ts` com funções para:
  - Sanitização de strings (prevenção XSS)
  - Sanitização de HTML
  - Validação de URLs
  - Armazenamento seguro no localStorage
  - Validação de entrada de formulários

- **Prevenção XSS**: Substituição de `innerHTML` por métodos seguros usando `createSafeElement()`

### 2. Configurações de Segurança

- **Arquivo de Configuração**: `src/config/security.ts` centraliza:
  - Content Security Policy (CSP)
  - Validação de entrada
  - Headers de segurança
  - Rate limiting
  - Configurações de sessão

### 3. Proteção de Dados Sensíveis

- **Logs Seguros**: Remoção de senhas e dados sensíveis dos logs
- **Validação de Entrada**: Padrões rigorosos para email, telefone e senhas
- **Armazenamento Seguro**: Sanitização antes de salvar no localStorage

### 4. Headers de Segurança

```typescript
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()'
```

### 5. Validação de Senhas

- Mínimo 8 caracteres
- Pelo menos uma letra maiúscula
- Pelo menos uma letra minúscula
- Pelo menos um número
- Pelo menos um caractere especial

## ⚠️ Vulnerabilidades Identificadas

### Dependências

1. **@eslint/plugin-kit < 0.3.4**: Vulnerável a ataques RegEx DoS
2. **esbuild <= 0.24.2**: Permite requests não autorizados ao servidor de desenvolvimento
3. **vite 0.11.0 - 6.1.6**: Depende de versão vulnerável do esbuild

### Recomendações de Correção

```bash
# Atualizar dependências vulneráveis
npm update @eslint/plugin-kit
npm update vite

# Para conflitos de peer dependencies
npm install --legacy-peer-deps
```

## 🔧 Configurações Recomendadas

### Variáveis de Ambiente

```env
# .env (NUNCA commitar este arquivo)
VITE_MAPBOX_ACCESS_TOKEN=seu_token_aqui
VITE_API_URL=https://sua-api-segura.com

# Para produção, usar HTTPS
VITE_USE_HTTPS=true
```

### Supabase (Quando Implementado)

1. **Row Level Security (RLS)**: Sempre ativado em todas as tabelas
2. **Service Role Key**: Apenas no backend, nunca no frontend
3. **Anon Key**: Apenas para operações públicas protegidas por RLS
4. **Políticas de Acesso**: Baseadas em roles e permissões

## 🚨 Práticas de Segurança

### Para Desenvolvedores

1. **Nunca commitar**:
   - Arquivos `.env`
   - Tokens de API
   - Senhas ou secrets
   - Chaves privadas

2. **Sempre validar**:
   - Entrada do usuário
   - URLs de redirecionamento
   - Dados antes de armazenar

3. **Usar HTTPS**:
   - Em produção sempre
   - Em desenvolvimento quando possível

4. **Logs seguros**:
   - Nunca logar dados sensíveis
   - Usar níveis apropriados de log
   - Sanitizar dados antes de logar

### Para Produção

1. **Configurar CSP** adequadamente
2. **Implementar rate limiting**
3. **Monitorar logs** de segurança
4. **Atualizar dependências** regularmente
5. **Fazer backup** dos dados importantes

## 🔍 Auditoria de Segurança

### Checklist de Segurança

- [x] Sanitização de entrada implementada
- [x] Logs seguros (sem dados sensíveis)
- [x] Headers de segurança configurados
- [x] Validação de formulários robusta
- [x] Prevenção XSS implementada
- [x] Configurações centralizadas
- [ ] Dependências vulneráveis corrigidas
- [ ] HTTPS configurado para produção
- [ ] Supabase RLS implementado
- [ ] Rate limiting implementado

### Comandos de Auditoria

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades automáticas
npm audit fix

# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências
npm update
```

## 📞 Contato de Segurança

Para reportar vulnerabilidades de segurança:

1. **NÃO** abra issues públicas
2. Entre em contato diretamente com a equipe
3. Forneça detalhes da vulnerabilidade
4. Aguarde confirmação antes de divulgar

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://react.dev/learn/security)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Vite Security Guide](https://vitejs.dev/guide/env-and-mode.html#security-notes)

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0