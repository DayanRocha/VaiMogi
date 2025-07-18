
import { ArrowLeft, User, School as SchoolIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Student, School } from '@/types/driver';

interface RouteItem {
  id: string;
  type: 'student' | 'school';
  item: Student | School;
  direction?: 'embarque' | 'desembarque';
}

interface RouteMountingPageProps {
  onBack: () => void;
  onSave: () => void;
  routeItems: RouteItem[];
}

export const RouteMountingPage = ({ onBack, onSave, routeItems }: RouteMountingPageProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span>Início</span>
          <span className="mx-2">/</span>
          <span>Rotas</span>
          <span className="mx-2">/</span>
          <span>Cadastrar Rota</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Montar Rota</span>
        </div>
        
        <h1 className="text-xl font-bold text-gray-800">
          Montagem da rota "Rota ida Manhã"
        </h1>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Info Box */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-xs">i</span>
            </div>
            <p className="text-blue-800 text-sm">
              Monte abaixo o percurso do motorista, indicando a ordem de embarque ou desembarque nas casas dos alunos e das paradas nas escolas.
            </p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">Itens da Rota</h2>

        {/* Add buttons */}
        <div className="space-y-3 mb-6">
          <Button
            variant="outline"
            className="w-full p-4 border-2 border-dashed border-gray-300 hover:border-orange-300 hover:bg-orange-50"
          >
            <User className="w-5 h-5 mr-2" />
            Adicionar estudante
          </Button>

          <Button
            variant="outline"
            className="w-full p-4 border-2 border-dashed border-gray-300 hover:border-orange-300 hover:bg-orange-50"
          >
            <SchoolIcon className="w-5 h-5 mr-2" />
            Adicionar escola
          </Button>
        </div>

        {/* Route items list */}
        {routeItems.length > 0 ? (
          <div className="space-y-3 mb-6">
            {routeItems.map((routeItem, index) => (
              <div key={routeItem.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      {routeItem.type === 'student' ? (
                        <User className="w-5 h-5 text-gray-600" />
                      ) : (
                        <SchoolIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{routeItem.item.name}</h3>
                      {routeItem.direction && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {routeItem.direction === 'embarque' ? 'Embarque' : 'Desembarque'}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6 text-center">
            <p className="text-yellow-800">Esta rota não tem itens</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={onSave}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
          >
            Cadastrar Rota
          </Button>

          <Button
            onClick={onBack}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 py-3"
          >
            Voltar
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          VanEscola 2025
        </div>
      </div>
    </div>
  );
};
