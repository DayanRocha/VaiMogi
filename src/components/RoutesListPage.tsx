
import { useState } from 'react';
import { ArrowLeft, Plus, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RoutesListPageProps {
  onBack: () => void;
  onCreateRoute: () => void;
  onActiveRoutes: () => void;
  onRouteHistory: () => void;
}

export const RoutesListPage = ({ 
  onBack, 
  onCreateRoute, 
  onActiveRoutes, 
  onRouteHistory 
}: RoutesListPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockRoutes = [
    {
      id: '4318',
      name: 'Rota da Manhã',
      van: 'Tia Be',
      time: '06:00',
      days: 'Seg, Ter, Qua, Qui, Sex'
    },
    {
      id: '5078',
      name: 'Rota da Manhã',
      van: 'Tia Be',
      time: '06:00',
      days: 'Seg, Ter, Qua, Qui, Sex'
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
        <button className="w-6 h-6 flex items-center justify-center">
          <div className="w-5 h-4 flex flex-col gap-1">
            <div className="w-full h-0.5 bg-white"></div>
            <div className="w-full h-0.5 bg-white"></div>
            <div className="w-full h-0.5 bg-white"></div>
          </div>
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 text-white text-sm">
          <button onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Início
          </button>
          <span>/</span>
          <span>Rotas</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Lista de Rotas</h1>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={onCreateRoute}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Cadastrar rota
          </Button>
          <Button 
            onClick={onActiveRoutes}
            variant="outline"
            className="border-gray-300 text-gray-700 px-4 py-2 rounded-lg"
          >
            Rotas em execução
          </Button>
          <Button 
            onClick={onRouteHistory}
            variant="outline"
            className="border-gray-300 text-gray-700 px-4 py-2 rounded-lg"
          >
            Histórico de rotas
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Input
            placeholder="Pesquisar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-1 rounded">
            <span className="text-xs">×</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option>Turno</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option>Van</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option>Ordenar</option>
          </select>
        </div>

        {/* Routes List */}
        <div className="space-y-4">
          {mockRoutes.map((route) => (
            <div key={route.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">Id: {route.id}</span>
                    <span className="text-sm text-gray-500">Van: {route.van}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Horário: {route.time}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Dias: {route.days}
                  </div>
                </div>
                <button className="text-gray-400">
                  <span className="text-xl">›</span>
                </button>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{route.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
