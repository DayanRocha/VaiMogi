// Serviço para simular localizações realistas em São Paulo para testes

export interface MockLocation {
  lat: number;
  lng: number;
  address: string;
  name: string;
}

// Localizações reais em São Paulo para testes
export const mockLocations: MockLocation[] = [
  {
    lat: -23.5505,
    lng: -46.6333,
    address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
    name: "Centro de São Paulo"
  },
  {
    lat: -23.5475,
    lng: -46.6361,
    address: "Rua Augusta, 500 - Consolação, São Paulo - SP", 
    name: "Rua Augusta"
  },
  {
    lat: -23.5558,
    lng: -46.6396,
    address: "Av. Brigadeiro Luís Antônio, 800 - Bela Vista, São Paulo - SP",
    name: "Brigadeiro"
  },
  {
    lat: -23.5431,
    lng: -46.6291,
    address: "Rua da Consolação, 300 - Consolação, São Paulo - SP",
    name: "Consolação"
  },
  {
    lat: -23.5489,
    lng: -46.6388,
    address: "Av. 9 de Julho, 600 - Bela Vista, São Paulo - SP",
    name: "9 de Julho"
  }
];

// Simular movimento do motorista entre pontos
export class MockDriverMovement {
  private currentIndex = 0;
  private progress = 0;
  private isMoving = false;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: ((location: { lat: number; lng: number }) => void)[] = [];

  constructor(private locations: MockLocation[]) {}

  // Adicionar listener para mudanças de localização
  addListener(callback: (location: { lat: number; lng: number }) => void) {
    this.listeners.push(callback);
  }

  // Remover listener
  removeListener(callback: (location: { lat: number; lng: number }) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // Notificar listeners
  private notifyListeners(location: { lat: number; lng: number }) {
    this.listeners.forEach(listener => listener(location));
  }

  // Iniciar movimento simulado
  startMovement() {
    if (this.isMoving) return;
    
    this.isMoving = true;
    this.intervalId = setInterval(() => {
      this.updatePosition();
    }, 2000); // Atualizar a cada 2 segundos

    console.log('🚗 Movimento simulado do motorista iniciado');
  }

  // Parar movimento
  stopMovement() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMoving = false;
    console.log('🛑 Movimento simulado do motorista parado');
  }

  // Atualizar posição atual
  private updatePosition() {
    if (this.currentIndex >= this.locations.length - 1) {
      // Chegou ao final, parar movimento
      this.stopMovement();
      return;
    }

    const currentLocation = this.locations[this.currentIndex];
    const nextLocation = this.locations[this.currentIndex + 1];

    // Interpolar entre localização atual e próxima
    const lat = currentLocation.lat + (nextLocation.lat - currentLocation.lat) * this.progress;
    const lng = currentLocation.lng + (nextLocation.lng - currentLocation.lng) * this.progress;

    this.notifyListeners({ lat, lng });

    // Avançar progresso
    this.progress += 0.1; // 10% a cada atualização

    if (this.progress >= 1) {
      // Chegou ao próximo ponto
      this.currentIndex++;
      this.progress = 0;
      
      if (this.currentIndex < this.locations.length) {
        console.log(`📍 Motorista chegou em: ${this.locations[this.currentIndex].name}`);
      }
    }
  }

  // Obter localização atual
  getCurrentLocation(): { lat: number; lng: number } {
    if (this.currentIndex >= this.locations.length) {
      return this.locations[this.locations.length - 1];
    }

    const currentLocation = this.locations[this.currentIndex];
    const nextLocation = this.locations[this.currentIndex + 1];

    if (!nextLocation) {
      return currentLocation;
    }

    // Interpolar posição atual
    const lat = currentLocation.lat + (nextLocation.lat - currentLocation.lat) * this.progress;
    const lng = currentLocation.lng + (nextLocation.lng - currentLocation.lng) * this.progress;

    return { lat, lng };
  }

  // Resetar para o início
  reset() {
    this.stopMovement();
    this.currentIndex = 0;
    this.progress = 0;
  }
}

// Instância global para testes
export const mockDriverMovement = new MockDriverMovement(mockLocations);