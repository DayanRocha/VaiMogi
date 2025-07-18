
import { Users, Truck, Route, School, UserCheck, Navigation, User, Home, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SettingsPageProps {
  onTabChange: (tab: string) => void;
  onBack: () => void;
  onClientsClick?: () => void;
  onDriversClick?: () => void;
  onSettingsClick?: () => void;
  activeTopButton?: 'clients' | 'drivers' | 'settings' | null;
}

export const SettingsPage = ({ 
  onTabChange, 
  onBack, 
  onClientsClick, 
  onDriversClick, 
  onSettingsClick,
  activeTopButton 
}: SettingsPageProps) => {
  const screens = [
    {
      id: 'home',
      title: 'Início',
      icon: Home,
      description: 'Página inicial do aplicativo'
    },
    {
      id: 'students',
      title: 'Estudantes',
      icon: Users,
      description: 'Gerenciar estudantes cadastrados'
    },
    {
      id: 'guardians',
      title: 'Responsáveis',
      icon: UserCheck,
      description: 'Contatos dos responsáveis'
    },
    {
      id: 'schools',
      title: 'Escolas',
      icon: School,
      description: 'Escolas cadastradas no sistema'
    },
    {
      id: 'profile',
      title: 'Perfil do Motorista',
      icon: User,
      description: 'Informações do motorista'
    },
    {
      id: 'van',
      title: 'Van',
      icon: Truck,
      description: 'Informações da van'
    },
    {
      id: 'routes',
      title: 'Rotas',
      icon: Route,
      description: 'Gerenciar rotas de transporte'
    },
    {
      id: 'trip',
      title: 'Viagem Ativa',
      icon: Navigation,
      description: 'Controle de viagem em andamento'
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-orange-500 font-bold text-sm">V</span>
          </div>
          <span className="text-white font-semibold text-lg">VANESCOLA</span>
        </div>
        <div className="w-6 h-6"></div>
      </div>

      {/* Top Icons - Always visible */}
      <div className="flex justify-center gap-8 px-4 mb-8">
        <button 
          className={`w-16 h-16 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors ${
            activeTopButton === 'clients' ? 'bg-white/40 shadow-lg' : 'bg-white/20'
          }`}
          onClick={onClientsClick}
        >
          <Users className="w-8 h-8 text-white" />
        </button>
        <button 
          className={`w-16 h-16 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors ${
            activeTopButton === 'drivers' ? 'bg-white/40 shadow-lg' : 'bg-white/20'
          }`}
          onClick={onDriversClick}
        >
          <Truck className="w-8 h-8 text-white" />
        </button>
        <button 
          className={`w-16 h-16 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors ${
            activeTopButton === 'settings' ? 'bg-white/40 shadow-lg' : 'bg-white/20'
          }`}
          onClick={onSettingsClick}
        >
          <Settings className="w-8 h-8 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4">
        <h2 className="text-white text-lg font-medium mb-6">Gerenciar Telas</h2>
        
        <div className="space-y-4">
          {screens.map((screen) => (
            <Card 
              key={screen.id}
              className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onTabChange(screen.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <screen.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 font-medium text-lg">{screen.title}</h3>
                    <p className="text-gray-600 text-sm">{screen.description}</p>
                  </div>
                </div>
                <div className="text-gray-400 text-xl">
                  <span>›</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
