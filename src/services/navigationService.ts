import { RoutePoint } from './realTimeTrackingService';

interface NavigationOptions {
    destination: RoutePoint;
    origin?: { lat: number; lng: number };
    mode?: 'driving' | 'walking' | 'transit';
}

class NavigationService {
    private static instance: NavigationService;

    private constructor() { }

    static getInstance(): NavigationService {
        if (!NavigationService.instance) {
            NavigationService.instance = new NavigationService();
        }
        return NavigationService.instance;
    }

    // Abrir navegação no Google Maps
    openGoogleMaps(options: NavigationOptions): void {
        const { destination, origin, mode = 'driving' } = options;

        let url = 'https://www.google.com/maps/dir/';

        if (origin) {
            url += `${origin.lat},${origin.lng}/`;
        }

        url += `${destination.lat},${destination.lng}`;
        url += `/@${destination.lat},${destination.lng},15z`;
        url += `/data=!3m1!4b1!4m2!4m1!3e${this.getModeCode(mode)}`;

        window.open(url, '_blank');
    }

    // Abrir navegação no Waze
    openWaze(options: NavigationOptions): void {
        const { destination } = options;
        const url = `https://waze.com/ul?ll=${destination.lat}%2C${destination.lng}&navigate=yes`;
        window.open(url, '_blank');
    }

    // Abrir navegação no Apple Maps (iOS)
    openAppleMaps(options: NavigationOptions): void {
        const { destination, origin } = options;

        let url = 'http://maps.apple.com/?';

        if (origin) {
            url += `saddr=${origin.lat},${origin.lng}&`;
        }

        url += `daddr=${destination.lat},${destination.lng}`;
        url += '&dirflg=d'; // driving directions

        window.open(url, '_blank');
    }

    // Detectar plataforma e abrir app apropriado
    openNativeNavigation(options: NavigationOptions): void {
        const userAgent = navigator.userAgent.toLowerCase();

        if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            this.openAppleMaps(options);
        } else if (userAgent.includes('android')) {
            this.openGoogleMaps(options);
        } else {
            // Desktop - abrir Google Maps
            this.openGoogleMaps(options);
        }
    }

    // Obter código do modo de transporte para Google Maps
    private getModeCode(mode: string): string {
        switch (mode) {
            case 'driving':
                return '0';
            case 'walking':
                return '2';
            case 'transit':
                return '3';
            default:
                return '0';
        }
    }

    // Calcular distância entre dois pontos (em metros)
    calculateDistance(
        point1: { lat: number; lng: number },
        point2: { lat: number; lng: number }
    ): number {
        const R = 6371e3; // Raio da Terra em metros
        const φ1 = (point1.lat * Math.PI) / 180;
        const φ2 = (point2.lat * Math.PI) / 180;
        const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
        const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Verificar se está próximo de um ponto (dentro do raio especificado)
    isNearPoint(
        currentLocation: { lat: number; lng: number },
        targetPoint: { lat: number; lng: number },
        radiusMeters: number = 100
    ): boolean {
        const distance = this.calculateDistance(currentLocation, targetPoint);
        return distance <= radiusMeters;
    }

    // Iniciar navegação com múltiplos pontos (rota completa)
    startRouteNavigation(routePoints: RoutePoint[], currentLocation?: { lat: number; lng: number }): void {
        if (routePoints.length === 0) {
            console.warn('⚠️ Nenhum ponto de rota fornecido para navegação');
            return;
        }

        console.log('🧭 Iniciando navegação automática da rota:', {
            totalPoints: routePoints.length,
            hasCurrentLocation: !!currentLocation
        });

        // Mostrar opções de navegação para o usuário
        this.showNavigationOptions(routePoints, currentLocation);
    }

    // Mostrar opções de navegação para o usuário escolher
    private showNavigationOptions(routePoints: RoutePoint[], currentLocation?: { lat: number; lng: number }): void {
        const firstDestination = routePoints[0];
        const destinationName = firstDestination.studentName || firstDestination.schoolName || firstDestination.address;

        // Criar modal de opções
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">🧭 Iniciar Navegação</h3>
                <p class="text-gray-600 mb-4">Escolha o app de navegação para ir até:</p>
                <p class="font-medium text-gray-800 mb-6">${destinationName}</p>
                
                <div class="space-y-3">
                    <button id="nav-google" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        🗺️ Google Maps
                    </button>
                    <button id="nav-waze" class="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        🚗 Waze
                    </button>
                    <button id="nav-apple" class="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        🍎 Apple Maps
                    </button>
                    <button id="nav-cancel" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const googleBtn = modal.querySelector('#nav-google');
        const wazeBtn = modal.querySelector('#nav-waze');
        const appleBtn = modal.querySelector('#nav-apple');
        const cancelBtn = modal.querySelector('#nav-cancel');

        const removeModal = () => {
            document.body.removeChild(modal);
        };

        googleBtn?.addEventListener('click', () => {
            this.openGoogleMapsRoute(routePoints, currentLocation);
            removeModal();
        });

        wazeBtn?.addEventListener('click', () => {
            this.openWazeRoute(routePoints, currentLocation);
            removeModal();
        });

        appleBtn?.addEventListener('click', () => {
            this.openAppleMapsRoute(routePoints, currentLocation);
            removeModal();
        });

        cancelBtn?.addEventListener('click', removeModal);

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                removeModal();
            }
        });
    }

    // Abrir Google Maps com rota completa
    private openGoogleMapsRoute(routePoints: RoutePoint[], currentLocation?: { lat: number; lng: number }): void {
        let url = 'https://www.google.com/maps/dir/';

        // Adicionar origem (localização atual ou primeiro ponto)
        if (currentLocation) {
            url += `${currentLocation.lat},${currentLocation.lng}/`;
        }

        // Adicionar todos os pontos da rota
        routePoints.forEach(point => {
            url += `${point.lat},${point.lng}/`;
        });

        // Configurações de navegação
        url += '?travelmode=driving';

        console.log('🗺️ Abrindo Google Maps com rota completa:', url);
        window.open(url, '_blank');
    }

    // Abrir Waze com primeiro destino (Waze não suporta múltiplos pontos)
    private openWazeRoute(routePoints: RoutePoint[], currentLocation?: { lat: number; lng: number }): void {
        const firstDestination = routePoints[0];
        const url = `https://waze.com/ul?ll=${firstDestination.lat}%2C${firstDestination.lng}&navigate=yes`;

        console.log('🚗 Abrindo Waze para primeiro destino:', url);
        window.open(url, '_blank');

        // Avisar sobre múltiplos pontos
        if (routePoints.length > 1) {
            setTimeout(() => {
                alert(`ℹ️ Waze aberto para o primeiro destino. Você tem ${routePoints.length - 1} parada(s) adicional(is) na rota.`);
            }, 1000);
        }
    }

    // Abrir Apple Maps com rota completa
    private openAppleMapsRoute(routePoints: RoutePoint[], currentLocation?: { lat: number; lng: number }): void {
        const firstDestination = routePoints[0];
        let url = 'http://maps.apple.com/?';

        if (currentLocation) {
            url += `saddr=${currentLocation.lat},${currentLocation.lng}&`;
        }

        url += `daddr=${firstDestination.lat},${firstDestination.lng}`;
        url += '&dirflg=d';

        console.log('🍎 Abrindo Apple Maps:', url);
        window.open(url, '_blank');

        // Avisar sobre múltiplos pontos se necessário
        if (routePoints.length > 1) {
            setTimeout(() => {
                alert(`ℹ️ Apple Maps aberto para o primeiro destino. Você tem ${routePoints.length - 1} parada(s) adicional(is) na rota.`);
            }, 1000);
        }
    }

    // Obter localização atual e iniciar navegação
    async startNavigationWithCurrentLocation(routePoints: RoutePoint[]): Promise<void> {
        console.log('📍 Obtendo localização atual para iniciar navegação...');

        try {
            const position = await this.getCurrentPosition();
            const currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            console.log('✅ Localização obtida:', {
                lat: currentLocation.lat.toFixed(6),
                lng: currentLocation.lng.toFixed(6),
                accuracy: position.coords.accuracy
            });

            this.startRouteNavigation(routePoints, currentLocation);
        } catch (error) {
            console.warn('⚠️ Erro ao obter localização, iniciando navegação sem origem:', error);
            this.startRouteNavigation(routePoints);
        }
    }

    // Promisificar getCurrentPosition
    private getCurrentPosition(): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não suportada'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }
}

export const navigationService = NavigationService.getInstance();
export type { NavigationOptions, RoutePoint };
