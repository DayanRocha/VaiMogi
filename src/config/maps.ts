// Configuração do Mapbox
export const MAPBOX_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  style: 'mapbox://styles/mapbox/streets-v12',
  // Removido defaultCenter fixo (São Paulo). O centro deve ser informado por quem usa o componente ou derivado dos dados.
  defaultZoom: 14,
  directionsApiUrl: 'https://api.mapbox.com/directions/v5/mapbox/driving'
};

// Obter token do Mapbox automaticamente (ambiente ou localStorage)
export const getMapboxToken = (): string => {
  // Primeiro, tentar buscar do ambiente (.env)
  const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (envToken && envToken.startsWith('pk.') && envToken.length > 20) {
    return envToken;
  }
  
  // Se não houver no ambiente, buscar do localStorage
  const savedToken = localStorage.getItem('mapboxAccessToken');
  if (savedToken && savedToken.startsWith('pk.') && savedToken.length > 20) {
    return savedToken;
  }
  
  return '';
};

// Verificar se o token está configurado
export const isMapboxConfigured = (): boolean => {
  const token = getMapboxToken();
  return token.startsWith('pk.') && token.length > 20;
};

// Atualizar configuração com token dinâmico
export const getMapboxConfig = () => {
  return {
    ...MAPBOX_CONFIG,
    accessToken: getMapboxToken()
  };
};

