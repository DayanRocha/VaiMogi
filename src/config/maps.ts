
// Configuração do Mapbox
export const MAPBOX_CONFIG = {
  accessToken: 'pk.eyJ1IjoiZGF5YW5yb2NoYSIsImEiOiJjbWRxNjIybm4wMzRuMmpvaW9hOHU4bXRxIn0.Qg9EpqZDmZSnkkac-otvOQ',
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
