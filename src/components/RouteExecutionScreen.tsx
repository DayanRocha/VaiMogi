import { useState } from 'react';
import { ArrowLeft, User, School as SchoolIcon, Home, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Route, Student, School } from '@/types/driver';

interface RouteItem {
    id: string;
    type: 'student' | 'school';
    name: string;
    details: string;
    studentData?: Student;
    schoolData?: School;
}

interface RouteExecutionScreenProps {
    route: Route;
    students: Student[];
    schools: School[];
    onBack: () => void;
    onSaveChanges: (routeItems: RouteItem[]) => void;
    onStartRoute: () => void;
}

export const RouteExecutionScreen = ({
    route,
    students,
    schools,
    onBack,
    onSaveChanges,
    onStartRoute
}: RouteExecutionScreenProps) => {
    const [routeItems, setRouteItems] = useState<RouteItem[]>([
        // Inicializar com os estudantes já cadastrados na rota
        ...route.students.map(student => ({
            id: student.id,
            type: 'student' as const,
            name: student.name,
            details: 'Embarque em casa',
            studentData: student
        }))
    ]);

    const [showStudentDialog, setShowStudentDialog] = useState(false);
    const [showSchoolDialog, setShowSchoolDialog] = useState(false);
    const [showStudentConfirmDialog, setShowStudentConfirmDialog] = useState(false);
    const [showSchoolConfirmDialog, setShowSchoolConfirmDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [studentPickupType, setStudentPickupType] = useState<'pickup' | 'dropoff'>('pickup');

    // Filtrar estudantes e escolas que já não estão na rota
    const availableStudents = students.filter(
        student => !routeItems.some(item => item.type === 'student' && item.id === student.id)
    );

    const availableSchools = schools.filter(
        school => !routeItems.some(item => item.type === 'school' && item.id === school.id)
    );

    const handleAddStudent = () => {
        setShowStudentDialog(true);
    };

    const handleAddSchool = () => {
        setShowSchoolDialog(true);
    };

    const handleStudentSelect = (student: Student) => {
        setSelectedStudent(student);
        setShowStudentDialog(false);
        setShowStudentConfirmDialog(true);
    };

    const handleSchoolSelect = (school: School) => {
        setSelectedSchool(school);
        setShowSchoolDialog(false);
        setShowSchoolConfirmDialog(true);
    };

    const handleConfirmStudent = () => {
        if (selectedStudent) {
            const newItem: RouteItem = {
                id: selectedStudent.id,
                type: 'student',
                name: selectedStudent.name,
                details: studentPickupType === 'pickup' ? 'Embarque em casa' : 'Desembarque em casa',
                studentData: selectedStudent
            };
            setRouteItems(prev => [...prev, newItem]);
            setShowStudentConfirmDialog(false);
            setSelectedStudent(null);
        }
    };

    const handleConfirmSchool = () => {
        if (selectedSchool) {
            const newItem: RouteItem = {
                id: selectedSchool.id,
                type: 'school',
                name: selectedSchool.name,
                details: 'Parada',
                schoolData: selectedSchool
            };
            setRouteItems(prev => [...prev, newItem]);
            setShowSchoolConfirmDialog(false);
            setSelectedSchool(null);
        }
    };

    const handleRemoveItem = (itemId: string) => {
        setRouteItems(prev => prev.filter(item => item.id !== itemId));
    };

    const getSchoolName = (schoolId: string) => {
        const school = schools.find(s => s.id === schoolId);
        return school ? school.name : 'Escola não encontrada';
    };

    const getStudentInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2);
    };

    const getItemColor = (index: number) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-orange-500',
            'bg-gray-500'
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 pt-12">
                <button onClick={onBack} className="text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-white font-semibold text-xl">{route.name}</h1>
            </div>

            {/* Content */}
            <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
                {/* Route Items List */}
                <div className="space-y-3 mb-6">
                    {routeItems.map((item, index) => (
                        <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {item.type === 'student' ? (
                                    <div className={`w-12 h-12 ${getItemColor(index)} rounded-full flex items-center justify-center`}>
                                        <span className="text-white font-bold text-sm">
                                            {getStudentInitials(item.name)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className={`w-12 h-12 ${getItemColor(index)} rounded-full flex items-center justify-center`}>
                                        <SchoolIcon className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-gray-500">{item.details}</p>
                                    {item.type === 'student' && item.studentData && (
                                        <p className="text-xs text-gray-400">
                                            {getSchoolName(item.studentData.schoolId)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Home className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-400">→</span>
                                <SchoolIcon className="w-5 h-5 text-gray-400" />
                                <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="ml-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Buttons */}
                <div className="space-y-3 mb-6">
                    <Button
                        onClick={handleAddStudent}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-full flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Incluir aluno
                    </Button>

                    <Button
                        onClick={handleAddSchool}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-full flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Incluir escola
                    </Button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={() => onSaveChanges(routeItems)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold"
                    >
                        Salvar mudanças na rota
                    </Button>

                    <Button
                        onClick={onStartRoute}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
                    >
                        Iniciar rota
                    </Button>
                </div>
            </div>

            {/* Student Selection Dialog */}
            <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Selecionar Estudante</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        {availableStudents.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">
                                Todos os estudantes já foram adicionados à rota
                            </p>
                        ) : (
                            availableStudents.map((student) => (
                                <div
                                    key={student.id}
                                    onClick={() => handleStudentSelect(student)}
                                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                >
                                    <h3 className="font-medium text-gray-800">{student.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        Escola: {getSchoolName(student.schoolId)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* School Selection Dialog */}
            <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Selecionar Escola</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        {availableSchools.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">
                                Todas as escolas já foram adicionadas à rota
                            </p>
                        ) : (
                            availableSchools.map((school) => (
                                <div
                                    key={school.id}
                                    onClick={() => handleSchoolSelect(school)}
                                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                >
                                    <h3 className="font-medium text-gray-800">{school.name}</h3>
                                    <p className="text-sm text-gray-500">{school.address}</p>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Student Confirmation Dialog */}
            <Dialog open={showStudentConfirmDialog} onOpenChange={setShowStudentConfirmDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Configurar Estudante</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedStudent && (
                            <>
                                <div className="text-center">
                                    <h3 className="font-medium text-gray-800 mb-2">{selectedStudent.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        Escola: {getSchoolName(selectedStudent.schoolId)}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="pickup"
                                            name="pickupType"
                                            checked={studentPickupType === 'pickup'}
                                            onChange={() => setStudentPickupType('pickup')}
                                        />
                                        <label htmlFor="pickup" className="text-sm">Embarcar em casa</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="dropoff"
                                            name="pickupType"
                                            checked={studentPickupType === 'dropoff'}
                                            onChange={() => setStudentPickupType('dropoff')}
                                        />
                                        <label htmlFor="dropoff" className="text-sm">Desembarcar em casa</label>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={handleConfirmStudent}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                    >
                                        Confirmar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowStudentConfirmDialog(false)}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* School Confirmation Dialog */}
            <Dialog open={showSchoolConfirmDialog} onOpenChange={setShowSchoolConfirmDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Escola</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedSchool && (
                            <>
                                <div className="text-center">
                                    <h3 className="font-medium text-gray-800 mb-2">{selectedSchool.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedSchool.address}</p>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={handleConfirmSchool}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                    >
                                        Confirmar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSchoolConfirmDialog(false)}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};