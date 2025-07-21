
import { useState, useEffect } from 'react';
import { Driver, Van, Route, Student, School, Guardian, Trip, TripStudent } from '@/types/driver';

// Mock data - In a real app, this would come from Supabase
const mockDriver: Driver = {
  id: '1',
  name: 'João Silva',
  phone: '(11) 99999-9999',
  address: 'Rua das Flores, 123 - São Paulo, SP',
  photo: '/placeholder.svg'
};

const mockVan: Van = {
  id: '1',
  driverId: '1',
  model: 'Fiat Ducato',
  plate: 'ABC-1234',
  capacity: 15,
  observations: 'Van em excelente estado'
};

const mockGuardians: Guardian[] = [
  {
    id: 'g1',
    name: 'Maria Silva',
    email: 'maria.silva@email.com',
    phone: '(11) 98765-4321',
    isActive: true
  },
  {
    id: 'g2',
    name: 'José Santos',
    email: 'jose.santos@email.com',
    phone: '(11) 97654-3210',
    isActive: true
  },
  {
    id: 'g3',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@email.com',
    phone: '(11) 96543-2109',
    isActive: false
  },
  {
    id: 'g4',
    name: 'Carlos Pereira',
    email: 'carlos.pereira@email.com',
    phone: '(11) 95432-1098',
    isActive: true
  },
  {
    id: 'g5',
    name: 'Fernanda Costa',
    email: 'fernanda.costa@email.com',
    phone: '(11) 94321-0987',
    isActive: false
  }
];

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Ana Silva',
    guardianId: 'g1',
    pickupPoint: 'Rua A, 100',
    schoolId: 's1',
    status: 'waiting'
  },
  {
    id: '2',
    name: 'Bruno Santos',
    guardianId: 'g2',
    pickupPoint: 'Rua B, 200',
    schoolId: 's1',
    status: 'waiting'
  },
  {
    id: '3',
    name: 'Carla Oliveira',
    guardianId: 'g3',
    pickupPoint: 'Rua C, 300',
    schoolId: 's2',
    status: 'waiting'
  }
];

const mockSchools: School[] = [
  {
    id: 's1',
    name: 'Escola Municipal Dom Pedro',
    address: 'Av. Paulista, 1000'
  },
  {
    id: 's2',
    name: 'Colégio Santa Clara',
    address: 'Rua Augusta, 500'
  }
];

const mockRoutes: Route[] = [
  {
    id: '1',
    driverId: '1',
    name: 'Rota Manhã',
    startTime: '06:30',
    weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    students: mockStudents
  }
];

export const useDriverData = () => {
  const [driver, setDriver] = useState<Driver>(mockDriver);
  const [van, setVan] = useState<Van>(mockVan);
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [schools, setSchools] = useState<School[]>(mockSchools);
  const [guardians, setGuardians] = useState<Guardian[]>(mockGuardians);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const updateDriver = (updatedDriver: Partial<Driver>) => {
    setDriver(prev => ({ ...prev, ...updatedDriver }));
  };

  const updateVan = (updatedVan: Partial<Van>) => {
    setVan(prev => ({ ...prev, ...updatedVan }));
  };

  const addRoute = (route: Omit<Route, 'id'>) => {
    const newRoute = { ...route, id: Date.now().toString() };
    setRoutes(prev => [...prev, newRoute]);
  };

  const updateRoute = (routeId: string, updates: Partial<Route>) => {
    setRoutes(prev => prev.map(route => 
      route.id === routeId ? { ...route, ...updates } : route
    ));
  };

  const deleteRoute = (routeId: string) => {
    setRoutes(prev => prev.filter(route => route.id !== routeId));
  };

  const addStudent = (studentData: {
    name: string;
    address: string;
    schoolId: string;
    guardianId: string;
    guardianPhone: string;
    guardianEmail: string;
  }) => {
    const newStudent: Student = {
      id: Date.now().toString(),
      name: studentData.name,
      guardianId: studentData.guardianId,
      pickupPoint: studentData.address,
      schoolId: studentData.schoolId,
      status: 'waiting'
    };
    setStudents(prev => [...prev, newStudent]);
    console.log(`📚 Novo aluno cadastrado: ${studentData.name}`);
  };

  const updateStudent = (studentId: string, studentData: {
    name: string;
    address: string;
    schoolId: string;
    guardianId: string;
    guardianPhone: string;
    guardianEmail: string;
  }) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? {
            ...student,
            name: studentData.name,
            pickupPoint: studentData.address,
            schoolId: studentData.schoolId,
            guardianId: studentData.guardianId
          }
        : student
    ));
    console.log(`📚 Aluno atualizado: ${studentData.name}`);
  };

  const deleteStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setStudents(prev => prev.filter(student => student.id !== studentId));
    console.log(`📚 Aluno excluído: ${student?.name}`);
  };

  const addGuardian = (guardianData: { name: string; email: string; phone: string }) => {
    const newGuardian: Guardian = {
      id: Date.now().toString(),
      name: guardianData.name,
      email: guardianData.email,
      phone: guardianData.phone,
      isActive: true // Novos responsáveis são ativos por padrão
    };
    setGuardians(prev => [...prev, newGuardian]);
    console.log(`👤 Novo responsável cadastrado: ${guardianData.name}`);
  };

  const updateGuardian = (guardianId: string, guardianData: Partial<Guardian>) => {
    setGuardians(prev => prev.map(guardian => 
      guardian.id === guardianId 
        ? { ...guardian, ...guardianData }
        : guardian
    ));
    console.log(`👤 Responsável atualizado: ${guardianData.name || 'Código gerado'}`);
  };

  const deleteGuardian = (guardianId: string) => {
    const guardian = guardians.find(g => g.id === guardianId);
    setGuardians(prev => prev.filter(guardian => guardian.id !== guardianId));
    console.log(`👤 Responsável excluído: ${guardian?.name}`);
  };

  const addSchool = (schoolData: { name: string; address: string }) => {
    const newSchool: School = {
      id: Date.now().toString(),
      name: schoolData.name,
      address: schoolData.address
    };
    setSchools(prev => [...prev, newSchool]);
    console.log(`🏫 Nova escola cadastrada: ${schoolData.name}`);
  };

  const updateSchool = (schoolId: string, schoolData: { name: string; address: string }) => {
    setSchools(prev => prev.map(school => 
      school.id === schoolId 
        ? { ...school, name: schoolData.name, address: schoolData.address }
        : school
    ));
    console.log(`🏫 Escola atualizada: ${schoolData.name}`);
  };

  const deleteSchool = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    setSchools(prev => prev.filter(school => school.id !== schoolId));
    console.log(`🏫 Escola excluída: ${school?.name}`);
  };

  const startTrip = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      const trip: Trip = {
        id: Date.now().toString(),
        routeId,
        date: new Date().toISOString(),
        status: 'in_progress',
        students: route.students.map(student => ({
          studentId: student.id,
          status: 'waiting'
        }))
      };
      setActiveTrip(trip);
      
      // Notificar todos os responsáveis dos estudantes da rota
      console.log(`🚐 ROTA INICIADA: ${route.name}`);
      console.log(`📱 Notificando todos os responsáveis que a van está a caminho...`);
      
      route.students.forEach(student => {
        const guardian = guardians.find(g => g.id === student.guardianId);
        if (guardian) {
          console.log(`📲 Notificação enviada para ${guardian.name} (${guardian.phone}): "A van está a caminho para buscar ${student.name}. Rota: ${route.name}"`);
        }
      });
      
      console.log(`✅ ${route.students.length} responsáveis notificados sobre o início da rota ${route.name}`);
    }
  };

  const updateStudentStatus = (studentId: string, status: TripStudent['status']) => {
    if (activeTrip) {
      const updatedTrip = {
        ...activeTrip,
        students: activeTrip.students.map(student =>
          student.studentId === studentId ? { ...student, status } : student
        )
      };
      setActiveTrip(updatedTrip);
      
      // Send notifications based on status
      const student = students.find(s => s.id === studentId);
      if (student) {
        switch (status) {
          case 'van_arrived':
            console.log(`🚐 Notificação: A van chegou no ponto de ${student.name}`);
            break;
          case 'embarked':
            console.log(`🚐 Notificação: ${student.name} embarcou na van`);
            break;
          case 'at_school':
            console.log(`🚐 Notificação: ${student.name} chegou na escola`);
            break;
          case 'disembarked':
            console.log(`🚐 Notificação: ${student.name} foi desembarcado na escola`);
            break;
        }
      }
    }
  };

  const finishTrip = () => {
    if (activeTrip) {
      setActiveTrip({ ...activeTrip, status: 'completed' });
      setTimeout(() => setActiveTrip(null), 2000);
    }
  };

  return {
    driver,
    van,
    routes,
    students,
    schools,
    guardians,
    activeTrip,
    updateDriver,
    updateVan,
    addRoute,
    updateRoute,
    deleteRoute,
    addStudent,
    updateStudent,
    deleteStudent,
    addGuardian,
    updateGuardian,
    deleteGuardian,
    addSchool,
    updateSchool,
    deleteSchool,
    startTrip,
    updateStudentStatus,
    finishTrip
  };
};
