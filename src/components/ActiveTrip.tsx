
import { useState } from 'react';
import { ArrowRight, ArrowLeft, MapPin, School, CheckCircle, Navigation, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [showGroupDisembarkDialog, setShowGroupDisembarkDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedStudentsForDisembark, setSelectedStudentsForDisembark] = useState<string[]>([]);

  if (!trip) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
        <div className="flex items-center justify-between p-4 pt-12">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-white font-semibold text-lg">Executando rota</span>
          </div>
          <span className="text-white text-sm">Nenhuma rota</span>
        </div>
        
        <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
          <div className="text-center py-12 text-gray-500">
            <Navigation className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma viagem ativa</p>
            <p className="text-sm">Inicie uma rota para começar</p>
          </div>
        </div>
      </div>
    );
  }

  const getStudent = (studentId: string) => students.find(s => s.id === studentId);
  const getSchool = (schoolId: string) => schools.find(s => s.id === schoolId);
  
  const getStudentTripData = (studentId: string) => 
    trip.students.find(s => s.studentId === studentId);

  // Agrupar estudantes por escola
  const groupStudentsBySchool = () => {
    const groups: { [schoolId: string]: { school: SchoolType; students: { student: Student; tripData: TripStudent }[] } } = {};
    
    trip.students.forEach((tripStudent) => {
      const student = getStudent(tripStudent.studentId);
      if (!student) return;
      
      const school = getSchool(student.schoolId);
      if (!school) return;
      
      if (!groups[school.id]) {
        groups[school.id] = { school, students: [] };
      }
      
      groups[school.id].students.push({ student, tripData: tripStudent });
    });
    
    return Object.values(groups);
  };

  const handleSwipe = (studentId: string, direction: 'left' | 'right') => {
    const tripStudent = getStudentTripData(studentId);
    if (!tripStudent) return;

    if (direction === 'right') {
      if (tripStudent.status === 'van_arrived') {
        onUpdateStudentStatus(studentId, 'embarked');
      } else if (tripStudent.status === 'at_school') {
        onUpdateStudentStatus(studentId, 'disembarked');
      }
    } else {
      if (tripStudent.status === 'waiting') {
        onUpdateStudentStatus(studentId, 'van_arrived');
      }
    }
  };

  const handleSchoolDisembark = (school: SchoolType) => {
    const schoolStudents = trip.students.filter(tripStudent => {
      const student = getStudent(tripStudent.studentId);
      return student && student.schoolId === school.id && tripStudent.status === 'at_school';
    });

    if (schoolStudents.length === 0) return;

    setSelectedSchool(school);
    setSelectedStudentsForDisembark(schoolStudents.map(ts => ts.studentId));
    setShowGroupDisembarkDialog(true);
  };

  const handleConfirmGroupDisembark = () => {
    selectedStudentsForDisembark.forEach(studentId => {
      onUpdateStudentStatus(studentId, 'disembarked');
    });
    setShowGroupDisembarkDialog(false);
    setSelectedSchool(null);
    setSelectedStudentsForDisembark([]);
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentsForDisembark(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const allStudentsCompleted = trip.students.every(s => s.status === 'disembarked');
  const schoolGroups = groupStudentsBySchool();



  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold text-lg">Executando rota</span>
        </div>
        <span className="text-white text-sm">Rota da manhã</span>
      </div>

      {/* Content */}
      <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
        <div className="space-y-4 mb-6">
          {schoolGroups.map((group) => {
            const studentsAtSchool = group.students.filter(s => s.tripData.status === 'at_school');
            const canDisembarkGroup = studentsAtSchool.length > 0;

            return (
              <div key={group.school.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* School Header */}
                <div 
                  className="p-4 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                  onClick={() => canDisembarkGroup && handleSchoolDisembark(group.school)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <School className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{group.school.name}</h3>
                      <p className="text-sm text-gray-500">
                        Desembarque ({studentsAtSchool.length})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <School className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Students List */}
                <div className="p-4 space-y-3">
                  {group.students.map(({ student, tripData }) => (
                    <div key={student.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{student.name}</h4>
                          <p className="text-xs text-gray-500">{student.pickupPoint}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          tripData.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                          tripData.status === 'van_arrived' ? 'bg-blue-100 text-blue-700' :
                          tripData.status === 'embarked' ? 'bg-green-100 text-green-700' :
                          tripData.status === 'at_school' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {tripData.status === 'waiting' ? 'Aguardando' :
                           tripData.status === 'van_arrived' ? 'Van chegou' :
                           tripData.status === 'embarked' ? 'Embarcado' :
                           tripData.status === 'at_school' ? 'Na escola' :
                           'Desembarcado'}
                        </div>

                        {/* Individual Actions */}
                        {tripData.status === 'waiting' && (
                          <Button
                            onClick={() => handleSwipe(student.id, 'left')}
                            variant="outline"
                            size="sm"
                          >
                            Van Chegou
                          </Button>
                        )}
                        
                        {tripData.status === 'van_arrived' && (
                          <Button
                            onClick={() => handleSwipe(student.id, 'right')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Embarcar
                          </Button>
                        )}
                        
                        {tripData.status === 'embarked' && (
                          <Button
                            onClick={() => onUpdateStudentStatus(student.id, 'at_school')}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Na Escola
                          </Button>
                        )}
                        
                        {tripData.status === 'at_school' && (
                          <Button
                            onClick={() => handleSwipe(student.id, 'right')}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Desembarcar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>



        {/* Finish Trip */}
        {allStudentsCompleted && (
          <div className="mt-6 mb-4">
            <Button
              onClick={() => setConfirmFinish(true)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
            >
              Encerrar Rota
            </Button>
          </div>
        )}
      </div>

      {/* Group Disembark Dialog */}
      <Dialog open={showGroupDisembarkDialog} onOpenChange={setShowGroupDisembarkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desembarque: {selectedSchool?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedStudentsForDisembark.map((studentId) => {
              const student = getStudent(studentId);
              if (!student) return null;

              return (
                <div key={studentId} className="flex items-center space-x-3">
                  <Checkbox
                    id={studentId}
                    checked={selectedStudentsForDisembark.includes(studentId)}
                    onCheckedChange={() => handleStudentToggle(studentId)}
                  />
                  <label htmlFor={studentId} className="text-sm font-medium">
                    {student.name}
                  </label>
                </div>
              );
            })}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleConfirmGroupDisembark}
                disabled={selectedStudentsForDisembark.length === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                OK
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGroupDisembarkDialog(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finish Trip Confirmation Dialog */}
      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4 py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Encerrar rota?</h3>
              <p className="text-sm text-gray-600">
                A rota será encerrada e não será possível desfazer essa ação.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setConfirmFinish(false)}
                className="flex-1 text-orange-500 border-orange-500 hover:bg-orange-50"
              >
                NÃO ENCERRAR
              </Button>
              <Button
                onClick={() => {
                  onFinishTrip();
                  setConfirmFinish(false);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                ENCERRAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
