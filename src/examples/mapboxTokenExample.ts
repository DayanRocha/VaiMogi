/**
 * Exemplo de uso do sistema automatizado de token do Mapbox
 * 
 * Este exemplo demonstra como o sistema agora busca automaticamente
 * o token do Mapbox sem solicitar entrada manual para novos responsáveis.
 */

import { getMapboxToken, getMapboxConfig, isMapboxConfigured } from '@/config/maps';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { realTimeTrackingService } from '@/services/realTimeTrackingService';

// ===== EXEMPLO 1: Busca automática do token =====
console.log('=== EXEMPLO 1: Busca automática do token ===');

// O sistema agora busca automaticamente o token do Mapbox
// 1. Primeiro do arquivo .env (VITE_MAPBOX_ACCESS_TOKEN)
// 2. Se não encontrar, busca do localStorage
const token = getMapboxToken();
console.log('Token encontrado:', token ? '✅ Sim' : '❌ Não');
console.log('Token configurado:', isMapboxConfigured() ? '✅ Sim' : '❌ Não');

// ===== EXEMPLO 2: Uso do hook useMapboxToken =====
console.log('\n=== EXEMPLO 2: Uso do hook useMapboxToken ===');

// Em um componente React, você pode usar o hook:
/*
function MeuComponente() {
  const { 
    token,           // Token atual
    isConfigured,    // Se está configurado
    isLoading,       // Se está carregando
    reloadToken,     // Recarregar token
    saveToken,       // Salvar novo token
    removeToken      // Remover token
  } = useMapboxToken();

  // O token é carregado automaticamente!
  useEffect(() => {
    if (isConfigured) {
      console.log('✅ Token do Mapbox carregado automaticamente!');
    } else {
      console.log('⚠️ Token do Mapbox não encontrado');
    }
  }, [isConfigured]);

  return (
    <div>
      {isLoading ? (
        <p>Carregando token...</p>
      ) : isConfigured ? (
        <p>✅ Mapbox configurado!</p>
      ) : (
        <p>⚠️ Token não encontrado</p>
      )}
    </div>
  );
}
*/

// ===== EXEMPLO 3: Configuração automática no serviço =====
console.log('\n=== EXEMPLO 3: Configuração automática no serviço ===');

// O realTimeTrackingService agora configura o token automaticamente
// Ele busca primeiro do .env, depois do localStorage
realTimeTrackingService.reloadMapboxToken();
console.log('✅ Token recarregado automaticamente no serviço');

// ===== EXEMPLO 4: Fluxo para novos responsáveis =====
console.log('\n=== EXEMPLO 4: Fluxo para novos responsáveis ===');

// ANTES (manual):
// 1. Responsável entra no app
// 2. Sistema pede para inserir token manualmente
// 3. Responsável precisa ir ao Mapbox, copiar token, colar no app

// AGORA (automático):
// 1. Responsável entra no app
// 2. Sistema busca token automaticamente do .env
// 3. Se encontrar, funciona imediatamente
// 4. Se não encontrar, ainda permite configuração manual como fallback

console.log('Fluxo automático implementado! 🎉');

// ===== EXEMPLO 5: Configuração do .env =====
console.log('\n=== EXEMPLO 5: Configuração do .env ===');

// No arquivo .env, adicione:
// VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWV1dXN1YXJpbyIsImEiOiJjbGV4YW1wbGUifQ.exemplo

// O sistema detectará automaticamente e usará este token
// para todos os novos responsáveis!

const config = getMapboxConfig();
console.log('Configuração atual:', {
  tokenConfigured: config.accessToken ? '✅ Sim' : '❌ Não',
  style: config.style,
  source: config.accessToken?.startsWith('pk.') ? 'Válido' : 'Inválido'
});

// ===== EXEMPLO 6: Teste de validação =====
console.log('\n=== EXEMPLO 6: Teste de validação ===');

// O sistema valida automaticamente se o token é válido
function testarToken(testToken: string) {
  const isValid = testToken && testToken.startsWith('pk.') && testToken.length > 20;
  console.log(`Token "${testToken.substring(0, 10)}...": ${isValid ? '✅ Válido' : '❌ Inválido'}`);
  return isValid;
}

// Exemplos de tokens
testarToken('pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.exemplo'); // Válido
testarToken('sk.invalid'); // Inválido
testarToken(''); // Inválido
testarToken('pk.short'); // Inválido (muito curto)

console.log('\n🎉 Sistema de token automático implementado com sucesso!');
console.log('📝 Agora novos responsáveis não precisam inserir o token manualmente!');
console.log('🔧 O token é buscado automaticamente do .env ou localStorage');
console.log('💡 Fallback manual ainda disponível se necessário');

export {};