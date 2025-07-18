
import { useState } from 'react';
import { ArrowLeft, Plus, Home, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Route, Student, School } from '@/types/driver';

interface RouteExecutionPageProps {
  route: Route | null;
  students: Student[];
  schools: School[];
  onBack: () => void;
  onAddStudent: () => void;
  onAddSchool: () => void;
  onRemoveStudent: (studentId: string) => void;
}

interface RouteStudent {
  id: string;
  name: string;
  school: string;
  status: 'pending' | 'picked-up' | 'dropped-off';
}

export const RouteExecutionPage = ({
  route,
  students,
  schools,
  onBack,
  onAddStudent,
  onAddSchool,
  onRemoveStudent
}: RouteExecutionPageProps) => {
  // Mock data para demonstrar a funcionalidade baseada na imagem
  const [routeStudents, setRouteStudents] = useState<RouteStudent[]>([
    {
      id: '1',
      name: 'Pietro Costa',
      school: 'Colégio Farroupilha',
      status: 'pending'
    },
    {
      id: '2', 
      name: 'Aline Freitas',
      school: 'Colégio Farroupilha',
      status: 'pending'
    }
  ]);

  const [routeSchools] = useState([
    {
      id: '1',
      name: 'Colégio Farroupilha'
    }
  ]);

  const handleRemoveStudent = (studentId: string) => {
    setRouteStudents(prev => prev.filter(student => student.id !== studentId));
    onRemoveStudent(studentId);
  };

  if (!route) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Rota não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-500">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 text-white">
        <button onClick={onBack} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Rota ida Manhã</h1>
        <div></div>
      </div>

      {/* Content */}
      <div className="bg-white min-h-screen rounded-t-3xl p-4">
        {/* Students List */}
        <div className="space-y-3 mb-6">
          {routeStudents.map((student) => (
            <div key={student.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{student.name}</h3>
                    <p className="text-sm text-gray-600">Embarque em casa</p>
                    <p className="text-sm text-gray-500">{student.school}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Home className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs">👥</span>
                  </button>
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs">🚗</span>
                  </button>
                  <button 
                    onClick={() => handleRemoveStudent(student.id)}
                    className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Schools List */}
          {routeSchools.map((school) => (
            <div key={school.id} className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs">🏫</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{school.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs">🚶</span>
                  </button>
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs">🚗</span>
                  </button>
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={onAddStudent}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Incluir aluno
          </Button>

          <Button
            onClick={onAddSchool}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Incluir escola
          </Button>
        </div>

        {/* Save Button */}
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold"
        >
          Salvar mudanças na rota
        </Button>

        {/* Start Route Button */}
        <Button
          className="w-full bg-red-500 hover:bg-red-600 text-white py-4 text-lg font-semibold mt-3"
        >
          Iniciar rota
        </Button>
      </div>
    </div>
  );
};
