
import { useState } from 'react';
import { ArrowRight, ArrowLeft, MapPin, School, CheckCircle, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Trip, Student, School as SchoolType, TripStudent } from '@/types/driver';

interface ActiveTripProps {
  trip: Trip | null;
  students: Student[];
  schools: SchoolType[];
  onUpdateStudentStatus: (studentId: string, status: TripStudent['status']) => void;
  onFinishTrip: () => void;
  onBack: () => void;
}

export const ActiveTrip = ({ trip, students, schools, onUpdateStudentStatus, onFinishTrip, onBack }: ActiveTripProps) => {
  const [confirmFinish, setConfirmFinish] = useState(false);

  if (!trip) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Viagem Ativa</h1>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma viagem ativa</p>
          <p className="text-sm">Inicie uma rota para começar</p>
        </div>
      </div>
    );
  }

  const getStudent = (studentId: string) => students.find(s => s.id === studentId);
  const getSchool = (schoolId: string) => schools.find(s => s.id === schoolId);
  
  const getStudentTripData = (studentId: string) => 
    trip.students.find(s => s.studentId === studentId);

  const handleSwipe = (studentId: string, direction: 'left' | 'right') => {
    const tripStudent = getStudentTripData(studentId);
    if (!tripStudent) return;

    if (direction === 'right') {
      // Swipe right - Embarcar
      if (tripStudent.status === 'van_arrived') {
        onUpdateStudentStatus(studentId, 'embarked');
      } else if (tripStudent.status === 'at_school') {
        onUpdateStudentStatus(studentId, 'disembarked');
      }
    } else {
      // Swipe left - Van chegou
      if (tripStudent.status === 'waiting') {
        onUpdateStudentStatus(studentId, 'van_arrived');
      }
    }
  };

  const allStudentsCompleted = trip.students.every(s => s.status === 'disembarked');

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Navigation className="w-6 h-6 mr-2 text-orange-500" />
          Viagem em Andamento
        </h1>
      </div>

      <div className="space-y-4 mb-6">
        {trip.students.map((tripStudent) => {
          const student = getStudent(tripStudent.studentId);
          const school = student ? getSchool(student.schoolId) : null;
          
          if (!student || !school) return null;

          return (
            <div key={student.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{student.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {student.pickupPoint}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <School className="w-4 h-4 mr-1" />
                    {school.name}
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  tripStudent.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                  tripStudent.status === 'van_arrived' ? 'bg-blue-100 text-blue-700' :
                  tripStudent.status === 'embarked' ? 'bg-green-100 text-green-700' :
                  tripStudent.status === 'at_school' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {tripStudent.status === 'waiting' ? 'Aguardando' :
                   tripStudent.status === 'van_arrived' ? 'Van chegou' :
                   tripStudent.status === 'embarked' ? 'Embarcado' :
                   tripStudent.status === 'at_school' ? 'Na escola' :
                   'Desembarcado'}
                </div>
              </div>

              {/* Swipe Actions */}
              <div className="flex gap-2">
                {tripStudent.status === 'waiting' && (
                  <Button
                    onClick={() => handleSwipe(student.id, 'left')}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Van Chegou
                  </Button>
                )}
                
                {tripStudent.status === 'van_arrived' && (
                  <Button
                    onClick={() => handleSwipe(student.id, 'right')}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Embarcar
                  </Button>
                )}
                
                {tripStudent.status === 'embarked' && (
                  <Button
                    onClick={() => onUpdateStudentStatus(student.id, 'at_school')}
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <School className="w-4 h-4 mr-1" />
                    Chegou na Escola
                  </Button>
                )}
                
                {tripStudent.status === 'at_school' && (
                  <Button
                    onClick={() => handleSwipe(student.id, 'right')}
                    size="sm"
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Desembarcar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Finish Trip */}
      {allStudentsCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          {!confirmFinish ? (
            <Button
              onClick={() => setConfirmFinish(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar Viagem
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-green-700 mb-3">Confirma a finalização da viagem?</p>
              <div className="flex gap-2">
                <Button
                  onClick={onFinishTrip}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Sim, Finalizar
                </Button>
                <Button
                  onClick={() => setConfirmFinish(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
