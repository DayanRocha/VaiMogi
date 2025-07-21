
import { useState, useRef } from 'react';
import { ArrowRight, ArrowLeft, MapPin, School, CheckCircle, Navigation, User, Bell, Home, Map } from 'lucide-react';
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

// Componente de item de estudante com swipe
interface SwipeableStudentItemProps {
  student: Student;
  tripData: TripStudent;
  school: SchoolType;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const SwipeableStudentItem = ({ student, tripData, school, onSwipeLeft, onSwipeRight }: SwipeableStudentItemProps) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (tripData.status !== 'waiting' && tripData.status !== 'van_arrived') return;
    
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    setDragX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX.current - startX.current;
    const threshold = 80; // Distância mínima para ativar o swipe
    
    if (Math.abs(deltaX) > threshold) {
      setIsAnimating(true);
      
      if (deltaX < 0 && tripData.status === 'waiting') {
        // Swipe para esquerda - Van chegou
        setSwipeDirection('left');
        setDragX(-300); // Animação para fora da tela
        setTimeout(() => {
          onSwipeLeft();
          setIsAnimating(false);
          setDragX(0);
          setSwipeDirection(null);
        }, 300);
      } else if (deltaX > 0 && tripData.status === 'van_arrived') {
        // Swipe para direita - Embarcar
        setSwipeDirection('right');
        setDragX(300); // Animação para fora da tela
        setTimeout(() => {
          onSwipeRight();
          setIsAnimating(false);
          setDragX(0);
          setSwipeDirection(null);
        }, 300);
      } else {
        // Volta para posição original com animação
        setDragX(0);
      }
    } else {
      // Volta para posição original com animação
      setDragX(0);
    }
    
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tripData.status !== 'waiting' && tripData.status !== 'van_arrived') return;
    
    setIsDragging(true);
    startX.current = e.clientX;
    currentX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.clientX;
    const deltaX = currentX.current - startX.current;
    setDragX(deltaX);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const studentAddress = encodeURIComponent(student.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${studentAddress}`;
    window.open(url, '_blank');
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const deltaX = currentX.current - startX.current;
    const threshold = 80;
    
    if (Math.abs(deltaX) > threshold) {
      setIsAnimating(true);
      
      if (deltaX < 0 && tripData.status === 'waiting') {
        setSwipeDirection('left');
        setDragX(-300);
        setTimeout(() => {
          onSwipeLeft();
          setIsAnimating(false);
          setDragX(0);
          setSwipeDirection(null);
        }, 300);
      } else if (deltaX > 0 && tripData.status === 'van_arrived') {
        setSwipeDirection('right');
        setDragX(300);
        setTimeout(() => {
          onSwipeRight();
          setIsAnimating(false);
          setDragX(0);
          setSwipeDirection(null);
        }, 300);
      } else {
        setDragX(0);
      }
    } else {
      setDragX(0);
    }
    
    setIsDragging(false);
  };

  const getStudentInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-gray-500';
      case 'van_arrived': return 'bg-orange-500';
      case 'embarked': return 'bg-green-500';
      case 'at_school': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Embarque em casa';
      case 'van_arrived': return 'Van chegou';
      case 'embarked': return 'Embarcado';
      case 'at_school': return 'Na escola';
      default: return 'Embarque em casa';
    }
  };

  const showNotificationIcon = tripData.status === 'van_arrived';

  const getSwipeProgress = () => {
    const maxDrag = 120;
    return Math.min(Math.abs(dragX) / maxDrag, 1);
  };

  const getBackgroundGradient = () => {
    const progress = getSwipeProgress();
    
    if (dragX < -30 && tripData.status === 'waiting') {
      return `linear-gradient(90deg, rgba(249, 115, 22, ${progress * 0.2}) 0%, rgba(255, 255, 255, 1) 50%)`;
    } else if (dragX > 30 && tripData.status === 'van_arrived') {
      return `linear-gradient(270deg, rgba(34, 197, 94, ${progress * 0.2}) 0%, rgba(255, 255, 255, 1) 50%)`;
    }
    return 'white';
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background indicators */}
      {dragX < -30 && tripData.status === 'waiting' && (
        <div 
          className="absolute left-0 top-0 h-full flex items-center justify-start pl-4 z-0"
          style={{ 
            width: `${Math.min(Math.abs(dragX) + 60, 200)}px`,
            background: 'linear-gradient(90deg, #f97316, #fb923c)',
            opacity: getSwipeProgress() * 0.9
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <Bell className="w-5 h-5" />
            <span className="font-medium">Van chegou!</span>
          </div>
        </div>
      )}
      
      {dragX > 30 && tripData.status === 'van_arrived' && (
        <div 
          className="absolute right-0 top-0 h-full flex items-center justify-end pr-4 z-0"
          style={{ 
            width: `${Math.min(dragX + 60, 200)}px`,
            background: 'linear-gradient(270deg, #22c55e, #4ade80)',
            opacity: getSwipeProgress() * 0.9
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="font-medium">Embarcar!</span>
            <User className="w-5 h-5" />
          </div>
        </div>
      )}

      <div 
        className={`bg-white rounded-lg p-4 shadow-lg relative z-10 ${
          isDragging ? 'cursor-grabbing shadow-xl' : 'cursor-grab'
        } ${isAnimating ? 'transition-all duration-300 ease-out' : ''}`}
        style={{ 
          transform: `translateX(${dragX}px) ${isDragging ? 'scale(1.02)' : 'scale(1)'}`,
          background: getBackgroundGradient(),
          boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleMapClick} className="p-2 rounded-full hover:bg-gray-100">
              <Map className="w-6 h-6 text-orange-500" />
            </button>
            <div className={`w-12 h-12 ${getStatusColor(tripData.status)} rounded-full flex items-center justify-center relative transition-all duration-200 ${
              isDragging ? 'scale-110' : 'scale-100'
            }`}>
              <span className="text-white font-bold text-sm">
                {getStudentInitials(student.name)}
              </span>
              {showNotificationIcon && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Bell className="w-3 h-3 text-white animate-bounce" />
                </div>
              )}
              
              {/* Efeito de swipe no círculo */}
              {isDragging && dragX < -30 && tripData.status === 'waiting' && (
                <div className="absolute inset-0 bg-orange-500 rounded-full flex items-center justify-center opacity-80">
                  <Bell className="w-4 h-4 text-white animate-pulse" />
                </div>
              )}
              
              {isDragging && dragX > 30 && tripData.status === 'van_arrived' && (
                <div className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center opacity-80">
                  <User className="w-4 h-4 text-white animate-pulse" />
                </div>
              )}
            </div>
            
            <div className={`transition-all duration-200 ${isDragging ? 'scale-105' : 'scale-100'}`}>
              <h4 className="font-medium text-gray-800">{student.name}</h4>
              <p className="text-sm text-gray-500">{getStatusText(tripData.status)}</p>
              <p className="text-xs text-gray-400">{school.name}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
            <Home className="w-5 h-5 text-gray-400" />
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <School className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Indicadores de swipe animados */}
        {isDragging && (
          <div className="mt-3 text-center">
            {dragX < -40 && tripData.status === 'waiting' && (
              <div className="flex items-center justify-center gap-2 text-orange-600 animate-pulse">
                <ArrowLeft className="w-4 h-4 animate-bounce" />
                <span className="text-sm font-medium">Deslize para notificar chegada</span>
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
            )}
            {dragX > 40 && tripData.status === 'van_arrived' && (
              <div className="flex items-center justify-center gap-2 text-green-600 animate-pulse">
                <User className="w-4 h-4 animate-bounce" />
                <span className="text-sm font-medium">Deslize para embarcar</span>
                <ArrowRight className="w-4 h-4 animate-bounce" />
              </div>
            )}
          </div>
        )}

        {/* Efeito de sucesso */}
        {swipeDirection && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
            <div className={`flex items-center gap-2 ${
              swipeDirection === 'left' ? 'text-orange-600' : 'text-green-600'
            } animate-pulse`}>
              {swipeDirection === 'left' ? (
                <>
                  <Bell className="w-6 h-6 animate-bounce" />
                  <span className="font-semibold">Responsáveis notificados!</span>
                </>
              ) : (
                <>
                  <User className="w-6 h-6 animate-bounce" />
                  <span className="font-semibold">Aluno embarcado!</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
        {/* Escolas para desembarque */}
        {schoolGroups.map((group) => {
          const studentsAtSchool = group.students.filter(s => s.tripData.status === 'at_school');
          
          if (studentsAtSchool.length === 0) return null;

          return (
            <div key={`school-${group.school.id}`} className="mb-4">
              <div 
                className="bg-white rounded-lg p-4 shadow-sm cursor-pointer"
                onClick={() => handleSchoolDisembark(group.school)}
              >
                <div className="flex items-center justify-between">
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
              </div>
            </div>
          );
        })}

        {/* Lista de estudantes embarcados - podem ser movidos para escola */}
        <div className="space-y-3 mb-6">
          {trip.students
            .filter(tripStudent => tripStudent.status === 'embarked')
            .map((tripStudent) => {
              const student = getStudent(tripStudent.studentId);
              const school = student ? getSchool(student.schoolId) : null;
              
              if (!student || !school) return null;

              return (
                <div key={student.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{student.name}</h3>
                        <p className="text-sm text-gray-500">Embarcado - {school.name}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        onUpdateStudentStatus(student.id, 'at_school');
                        console.log(`🏫 ${student.name} chegou na escola`);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm"
                    >
                      Chegou na Escola
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
        {/* Lista de estudantes para embarque */}
        <div className="space-y-3 mb-6">
          {trip.students
            .filter(tripStudent => {
              const status = tripStudent.status;
              return status === 'waiting' || status === 'van_arrived';
            })
            .map((tripStudent) => {
              const student = getStudent(tripStudent.studentId);
              const school = student ? getSchool(student.schoolId) : null;
              
              if (!student || !school) return null;

              return (
                <SwipeableStudentItem
                  key={student.id}
                  student={student}
                  tripData={tripStudent}
                  school={school}
                  onSwipeLeft={() => {
                    onUpdateStudentStatus(student.id, 'van_arrived');
                    console.log(`🔔 Notificação enviada: A van chegou no ponto de ${student.name}`);
                  }}
                  onSwipeRight={() => {
                    onUpdateStudentStatus(student.id, 'embarked');
                    console.log(`🚌 Notificação enviada: ${student.name} embarcou na van`);
                    // Automaticamente mover para "at_school" após embarcar
                    setTimeout(() => {
                      onUpdateStudentStatus(student.id, 'at_school');
                    }, 1000);
                  }}
                />
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
