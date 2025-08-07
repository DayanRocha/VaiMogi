// Configuração do Mapbox
export const MAPBOX_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  style: 'mapbox://styles/mapbox/streets-v12',
  defaultCenter: {
    lng: -46.6333,
    lat: -23.5505
  },
  defaultZoom: 14,
  directionsApiUrl: 'https://api.mapbox.com/directions/v5/mapbox/driving'
};

// Verificar se o token está configurado
export const isMapboxConfigured = (): boolean => {
  return MAPBOX_CONFIG.accessToken.startsWith('pk.') && 
         MAPBOX_CONFIG.accessToken.length > 20;
};

