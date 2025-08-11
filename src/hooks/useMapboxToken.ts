import { useState, useEffect } from 'react';
import { getMapboxToken } from '@/config/maps';

/**
 * Hook para gerenciar o token do Mapbox automaticamente
 * Busca primeiro do ambiente (.env), depois do localStorage
 */
export const useMapboxToken = () => {
  const [token, setToken] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Função para atualizar o token
  const updateToken = () => {
    const mapboxToken = getMapboxToken();
    setToken(mapboxToken);
    setIsConfigured(mapboxToken.length > 0);
    setIsLoading(false);
    
    if (mapboxToken) {
      console.log('✅ Token do Mapbox carregado automaticamente');
    } else {
      console.log('⚠️ Token do Mapbox não encontrado');
    }
  };

  // Carregar token na inicialização
  useEffect(() => {
    updateToken();
  }, []);

  // Escutar mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mapboxAccessToken') {
        updateToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Função para recarregar o token manualmente
  const reloadToken = () => {
    updateToken();
  };

  // Função para salvar token no localStorage
  const saveToken = (newToken: string) => {
    if (newToken && newToken.startsWith('pk.') && newToken.length > 20) {
      localStorage.setItem('mapboxAccessToken', newToken);
      updateToken();
      return true;
    }
    return false;
  };

  // Função para remover token
  const removeToken = () => {
    localStorage.removeItem('mapboxAccessToken');
    updateToken();
  };

  return {
    token,
    isConfigured,
    isLoading,
    reloadToken,
    saveToken,
    removeToken
  };
};

export default useMapboxToken;