
import { useState, useEffect } from 'react';
import { Driver, Van, Route, Student, School, Guardian, Trip, TripStudent } from '@/types/driver';
import { useNotificationIntegration } from '@/hooks/useNotificationIntegration';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';
import { routeTrackingService } from '@/services/routeTrackingService';

// Mock data - In a real app, this would come from Supabase
const mockDriver: Driver = {
  id: '1',
  name: 'João Silva',
  email: 'joao.silva@email.com',
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
    address: 'Rua A, 100',
    guardianId: 'g1',
    guardianPhone: '(11) 99999-1111',
    guardianEmail: 'ana.responsavel@email.com',
    pickupPoint: 'Rua A, 100',
    schoolId: 's1',
    status: 'waiting'
  },
  {
    id: '2',
    name: 'Bruno Santos',
    address: 'Rua B, 200',
    guardianId: 'g2',
    guardianPhone: '(11) 99999-2222',
    guardianEmail: 'bruno.responsavel@email.com',
    pickupPoint: 'Rua B, 200',
    schoolId: 's1',
    status: 'waiting'
  },
  {
    id: '3',
    name: 'Carla Oliveira',
    address: 'Rua C, 300',
    guardianId: 'g3',
    guardianPhone: '(11) 99999-3333',
    guardianEmail: 'carla.responsavel@email.com',
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
  // Carregar dados do motorista do localStorage se existirem
  const getInitialDriver = (): Driver => {
    const savedDriverData = localStorage.getItem('driverData');
    if (savedDriverData) {
      try {
        const parsedData = JSON.parse(savedDriverData);
        return { ...mockDriver, ...parsedData };
      } catch (error) {
        console.error('Erro ao carregar dados do motorista:', error);
      }
    }
    return mockDriver;
  };

  // Carregar dados dos responsáveis do localStorage se existirem
  const getInitialGuardians = (): Guardian[] => {
    const savedGuardians = localStorage.getItem('guardians');
    if (savedGuardians) {
      try {
        const parsedData = JSON.parse(savedGuardians);
        console.log('📋 Responsáveis carregados do localStorage:', parsedData);
        return parsedData;
      } catch (error) {
        console.error('Erro ao carregar dados dos responsáveis:', error);
      }
    }
    console.log('📋 Usando dados mock dos responsáveis');
    return mockGuardians;
  };

  // Carregar dados dos estudantes do localStorage se existirem
  const getInitialStudents = (): Student[] => {
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      try {
        const parsedData = JSON.parse(savedStudents);
        console.log('👨‍🎓 Estudantes carregados do localStorage:', parsedData);
        return parsedData;
      } catch (error) {
        console.error('Erro ao carregar dados dos estudantes:', error);
      }
    }
    console.log('👨‍🎓 Usando dados mock dos estudantes');
    return mockStudents;
  };

  // Carregar dados da van do localStorage se existirem
  const getInitialVan = (): Van => {
    const savedDriverData = localStorage.getItem('driverData');
    if (savedDriverData) {
      try {
        const driverData = JSON.parse(savedDriverData);
        if (driverData.van) {
          console.log('🚐 Van carregada do localStorage:', driverData.van);
          return driverData.van;
        }
      } catch (error) {
        console.error('Erro ao carregar dados da van:', error);
      }
    }
    console.log('🚐 Usando dados mock da van');
    return mockVan;
  };

  // Carregar dados das escolas do localStorage se existirem
  const getInitialSchools = (): School[] => {
    const savedSchools = localStorage.getItem('schools');
    if (savedSchools) {
      try {
        const parsedData = JSON.parse(savedSchools);
        console.log('🏫 Escolas carregadas do localStorage:', parsedData);
        return parsedData;
      } catch (error) {
        console.error('Erro ao carregar dados das escolas:', error);
      }
    }
    console.log('🏫 Usando dados mock das escolas');
    return mockSchools;
  };

  const [driver, setDriver] = useState<Driver>(getInitialDriver());
  const [van, setVan] = useState<Van>(getInitialVan());
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [students, setStudents] = useState<Student[]>(getInitialStudents());
  const [schools, setSchools] = useState<School[]>(getInitialSchools());
  const [guardians, setGuardians] = useState<Guardian[]>(getInitialGuardians());
  
  // Carregar activeTrip do localStorage se existir
  const getInitialActiveTrip = (): Trip | null => {
    const savedActiveTrip = localStorage.getItem('activeTrip');
    if (savedActiveTrip) {
      try {
        const parsedTrip = JSON.parse(savedActiveTrip);
        console.log('🚐 Viagem ativa carregada do localStorage:', parsedTrip);
        return parsedTrip;
      } catch (error) {
        console.error('Erro ao carregar viagem ativa:', error);
      }
    }
    console.log('🚐 Nenhuma viagem ativa no localStorage');
    return null;
  };

  const [activeTrip, setActiveTrip] = useState<Trip | null>(getInitialActiveTrip());
  const [notifiedGuardians, setNotifiedGuardians] = useState<Set<string>>(new Set());

  // Hook para integração com notificações
  const {
    notifyRouteStarted,
    notifyVanArrived,
    notifyEmbarked,
    notifyAtSchool,
    notifyDisembarked,
    notifyGroupDisembarked,
    notifyRouteFinished
  } = useNotificationIntegration({ students, schools });

  // Salvar responsáveis no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('guardians', JSON.stringify(guardians));
    console.log('💾 Responsáveis salvos no localStorage:', guardians);
  }, [guardians]);

  // Salvar estudantes no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
    console.log('💾 Estudantes salvos no localStorage:', students);
  }, [students]);

  // Salvar escolas no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('schools', JSON.stringify(schools));
    console.log('💾 Escolas salvas no localStorage:', schools);
  }, [schools]);

  // Salvar activeTrip no localStorage sempre que mudar
  useEffect(() => {
    if (activeTrip) {
      localStorage.setItem('activeTrip', JSON.stringify(activeTrip));
      console.log('💾 Viagem ativa salva no localStorage:', activeTrip);
    } else {
      localStorage.removeItem('activeTrip');
      console.log('🗑️ Viagem ativa removida do localStorage');
    }
  }, [activeTrip]);


  const updateDriver = (updatedDriver: Partial<Driver>) => {
    const newDriverData = { ...driver, ...updatedDriver };
    setDriver(newDriverData);
    // Salvar no localStorage
    localStorage.setItem('driverData', JSON.stringify(newDriverData));
  };

  const updateVan = (updatedVan: Partial<Van>) => {
    const newVanData = { ...van, ...updatedVan };
    setVan(newVanData);
    
    // Salvar van junto com os dados do motorista
    const currentDriverData = JSON.parse(localStorage.getItem('driverData') || '{}');
    const updatedDriverData = {
      ...currentDriverData,
      van: newVanData
    };
    localStorage.setItem('driverData', JSON.stringify(updatedDriverData));
    console.log('💾 Van salva junto com dados do motorista:', newVanData);
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
    console.log(`🔄 addStudent chamada com dados:`, studentData);
    
    const newStudent: Student = {
      id: Date.now().toString(),
      name: studentData.name,
      address: studentData.address,
      guardianId: studentData.guardianId,
      guardianPhone: studentData.guardianPhone,
      guardianEmail: studentData.guardianEmail,
      pickupPoint: studentData.address,
      schoolId: studentData.schoolId,
      status: 'waiting'
    };
    
    console.log(`📚 Criando novo aluno:`, newStudent);
    
    setStudents(prev => {
      const updatedStudents = [...prev, newStudent];
      console.log(`✅ Lista de alunos atualizada. Total: ${updatedStudents.length}`);
      return updatedStudents;
    });
    
    console.log(`✅ Novo aluno cadastrado: ${studentData.name} com dropoffLocation: ${newStudent.dropoffLocation}`);
  };

  const updateStudent = (studentId: string, studentData: {
    name: string;
    address: string;
    schoolId: string;
    guardianId: string;
    guardianPhone: string;
    guardianEmail: string;
    dropoffLocation?: 'home' | 'school';
  }) => {
    console.log(`🔄 Atualizando estudante ${studentData.name} com dropoffLocation: ${studentData.dropoffLocation}`);
    
    setStudents(prev => {
      const updatedStudents = prev.map(student => 
        student.id === studentId 
          ? {
              ...student,
              name: studentData.name,
              pickupPoint: studentData.address,
              schoolId: studentData.schoolId,
              guardianId: studentData.guardianId,
              dropoffLocation: studentData.dropoffLocation !== undefined ? studentData.dropoffLocation : student.dropoffLocation
            }
          : student
      );
      
      // Verificar se a atualização foi aplicada
      const updatedStudent = updatedStudents.find(s => s.id === studentId);
      console.log(`✅ ${updatedStudent?.name} atualizado: dropoffLocation = ${updatedStudent?.dropoffLocation}`);
      
      return updatedStudents;
    });
  };

  // Função específica para alternar o tipo de embarque/desembarque
  const toggleStudentDropoffType = (studentId: string) => {
    setStudents(prev => {
      const updatedStudents = prev.map(student => 
        student.id === studentId 
          ? {
              ...student,
              dropoffLocation: (student.dropoffLocation === 'home' ? 'school' : 'home') as 'home' | 'school'
            }
          : student
      );
      
      const updatedStudent = updatedStudents.find(s => s.id === studentId);
      const newType = updatedStudent?.dropoffLocation === 'home' ? 'Desembarque em casa' : 'Embarque em casa';
      console.log(`🔄 ${updatedStudent?.name} alterado para: ${newType}`);
      
      return updatedStudents;
    });
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
    setGuardians(prev => {
      const updated = prev.map(guardian => 
        guardian.id === guardianId 
          ? { ...guardian, ...guardianData }
          : guardian
      );
      console.log(`👤 Responsável atualizado:`, {
        id: guardianId,
        data: guardianData,
        updatedGuardian: updated.find(g => g.id === guardianId)
      });
      return updated;
    });
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

  const startTrip = (routeId: string, newStudentIds?: string[]) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      // Se há uma viagem ativa e novos alunos, atualizar a viagem existente
      if (activeTrip && newStudentIds && newStudentIds.length > 0) {
        // Adicionar novos alunos à viagem ativa
        const newTripStudents = newStudentIds.map(studentId => {
          const student = route.students.find(s => s.id === studentId);
          if (!student) return null;
          
          const routeConfig = route.studentConfigs?.find(config => config.studentId === student.id);
          
          let direction: 'to_school' | 'to_home';
          if (routeConfig) {
            direction = routeConfig.direction === 'embarque' ? 'to_school' : 'to_home';
            console.log(`📊 ${student.name}: configuração da rota=${routeConfig.direction} → direction=${direction}`);
          } else {
            direction = student.dropoffLocation === 'home' ? 'to_home' : 'to_school';
            console.log(`📊 ${student.name}: fallback dropoffLocation=${student.dropoffLocation} → direction=${direction}`);
          }
          
          return {
            studentId: student.id,
            status: 'waiting' as const,
            direction: direction
          };
        }).filter(Boolean) as TripStudent[];
        
        // Atualizar viagem ativa com novos alunos
        const updatedTrip = {
          ...activeTrip,
          students: [...activeTrip.students, ...newTripStudents]
        };
        setActiveTrip(updatedTrip);
        
        console.log(`🚐 ROTA ATUALIZADA: ${route.name}`);
        console.log(`📱 Notificando apenas os ${newStudentIds.length} novos alunos adicionados...`);
        
        // Notificar apenas os novos alunos que ainda não foram notificados
        const studentsToNotify = route.students.filter(student => newStudentIds.includes(student.id));
        let newNotifications = 0;
        
        studentsToNotify.forEach(student => {
          const guardian = guardians.find(g => g.id === student.guardianId);
          if (guardian && !notifiedGuardians.has(guardian.id)) {
            const message = student.dropoffLocation === 'home' ?
              `"A van está a caminho da escola para buscar ${student.name}. Rota: ${route.name}"` :
              `"A van está a caminho para buscar ${student.name}. Rota: ${route.name}"`;
            console.log(`📲 Notificação enviada para ${guardian.name} (${guardian.phone}): ${message}`);
            setNotifiedGuardians(prev => new Set([...prev, guardian.id]));
            newNotifications++;
          } else if (guardian && notifiedGuardians.has(guardian.id)) {
            console.log(`⏭️ Notificação já enviada para ${guardian.name} - pulando`);
          }
        });
        
        console.log(`✅ ${newNotifications} novos responsáveis notificados sobre a adição à rota ${route.name}`);
        return;
      }
      
      // Criar nova viagem (primeira vez ou sem novos alunos)
      const trip: Trip = {
        id: Date.now().toString(),
        routeId,
        date: new Date().toISOString(),
        status: 'in_progress',
        students: route.students.map(student => {
          // Usar configuração específica da rota se disponível
          const routeConfig = route.studentConfigs?.find(config => config.studentId === student.id);
          
          let direction: 'to_school' | 'to_home';
          if (routeConfig) {
            // Usar configuração da rota
            direction = routeConfig.direction === 'embarque' ? 'to_school' : 'to_home';
            console.log(`📊 ${student.name}: configuração da rota=${routeConfig.direction} → direction=${direction}`);
          } else {
            // Fallback para configuração do aluno
            direction = student.dropoffLocation === 'home' ? 'to_home' : 'to_school';
            console.log(`📊 ${student.name}: fallback dropoffLocation=${student.dropoffLocation} → direction=${direction}`);
          }
          
          return {
            studentId: student.id,
            status: 'waiting',
            direction: direction
          };
        })
      };
      setActiveTrip(trip);
      
      console.log(`🚐 ROTA INICIADA: ${route.name}`);
      
      // Iniciar rastreamento da rota no routeTrackingService
      const direction = trip.students[0]?.direction || 'to_school';
      const studentPickups = route.students.map(student => ({
        studentId: student.id,
        studentName: student.name,
        pickupLocation: student.address,
        status: 'pending' as const
      }));
      
      console.log('🗺️ Iniciando rastreamento da rota...');
      routeTrackingService.startRoute(
        driver.id,
        driver.name,
        direction,
        studentPickups
      );
      console.log('✅ Rastreamento da rota iniciado com sucesso');
      
      // Enviar notificação em tempo real para todos os responsáveis da rota
      const allGuardianIds = route.students
        .map(student => guardians.find(g => g.id === student.guardianId && (g.isActive !== false)))
        .filter(Boolean)
        .map(guardian => guardian!.id);

      if (allGuardianIds.length > 0) {
        realTimeNotificationService.sendNotification({
          type: 'route_started',
          title: 'Rota Iniciada',
          message: `${driver.name} iniciou a rota "${route.name}" com ${route.students.length} estudante(s)`,
          driverId: driver.id,
          driverName: driver.name,
          guardianIds: allGuardianIds
        });
      }
    }
  };

  const updateStudentStatus = async (studentId: string, status: TripStudent['status']) => {
    if (activeTrip) {
      console.log(`🔄 Atualizando status do aluno ${studentId} para: ${status}`);
      
      const tripStudent = activeTrip.students.find(ts => ts.studentId === studentId);
      const direction = tripStudent?.direction || 'to_school';
      const student = students.find(s => s.id === studentId);
      const studentName = student?.name || 'Estudante';
      
      const updatedTrip = {
        ...activeTrip,
        students: activeTrip.students.map(student =>
          student.studentId === studentId ? { ...student, status } : student
        )
      };
      setActiveTrip(updatedTrip);
      
      console.log(`✅ Status atualizado. Estado atual da viagem:`, updatedTrip.students);
      
      // Enviar notificações em tempo real para os responsáveis
      const studentGuardian = guardians.find(g => g.id === student?.guardianId && (g.isActive !== false));
      const guardianIds = studentGuardian ? [studentGuardian.id] : [];

      if (guardianIds.length > 0) {
        switch (status) {
          case 'van_arrived':
            realTimeNotificationService.sendNotification({
              type: 'arrived_at_location',
              title: 'Van Chegou!',
              message: direction === 'to_school' 
                ? `A van chegou no ponto de embarque de ${studentName}` 
                : `A van chegou na escola para buscar ${studentName}`,
              driverId: driver.id,
              driverName: driver.name,
              studentId,
              studentName,
              location: student?.address,
              guardianIds
            });
            break;
          case 'embarked':
            realTimeNotificationService.sendNotification({
              type: 'student_picked_up',
              title: 'Estudante Embarcou',
              message: direction === 'to_school'
                ? `${studentName} entrou na van e está a caminho da escola`
                : `${studentName} embarcou e está a caminho de casa`,
              driverId: driver.id,
              driverName: driver.name,
              studentId,
              studentName,
              guardianIds
            });
            break;
          case 'at_school':
            console.log(`📚 Enviando notificação de chegada na escola para ${studentName}`);
            realTimeNotificationService.sendNotification({
              type: 'student_dropped_off',
              title: 'Chegou na Escola',
              message: `${studentName} chegou na escola com segurança`,
              driverId: driver.id,
              driverName: driver.name,
              studentId,
              studentName,
              guardianIds
            });
            break;
          case 'disembarked':
            // Verificar se é desembarque na escola ou em casa
            if (direction === 'to_school') {
              // Desembarque na escola (ida para escola)
              console.log(`📚 Enviando notificação de chegada na escola para ${studentName}`);
              realTimeNotificationService.sendNotification({
                type: 'student_dropped_off',
                title: 'Chegou na Escola',
                message: `${studentName} chegou na escola com segurança`,
                driverId: driver.id,
                driverName: driver.name,
                studentId,
                studentName,
                guardianIds
              });
            } else {
              // Desembarque em casa (volta da escola)
              console.log(`🏠 Enviando notificação de chegada em casa para ${studentName}`);
              realTimeNotificationService.sendNotification({
                type: 'student_dropped_off',
                title: 'Estudante Desembarcou',
                message: `${studentName} desembarcou da van e chegou em casa`,
                driverId: driver.id,
                driverName: driver.name,
                studentId,
                studentName,
                guardianIds
              });
            }
            break;
        }
      }
      
      // Notificações legadas removidas para evitar duplicação
      // Agora usando apenas notificações em tempo real
    }
  };

  const updateMultipleStudentsStatus = async (studentIds: string[], status: TripStudent['status']) => {
    if (activeTrip) {
      console.log(`🔄 ATUALIZAÇÃO EM GRUPO: ${studentIds.length} alunos para status: ${status}`);
      
      const updatedTrip = {
        ...activeTrip,
        students: activeTrip.students.map(student =>
          studentIds.includes(student.studentId) ? { ...student, status } : student
        )
      };
      setActiveTrip(updatedTrip);
      
      console.log(`✅ Status atualizado EM GRUPO. Estado atual da viagem:`, updatedTrip.students);
      
      // Enviar notificações em tempo real para cada estudante
      for (const studentId of studentIds) {
        const tripStudent = activeTrip.students.find(ts => ts.studentId === studentId);
        const direction = tripStudent?.direction || 'to_school';
        const student = students.find(s => s.id === studentId);
        const studentName = student?.name || 'Estudante';
        
        // Encontrar responsáveis do estudante
        const studentGuardian = guardians.find(g => g.id === student?.guardianId && (g.isActive !== false));
        const guardianIds = studentGuardian ? [studentGuardian.id] : [];

        if (guardianIds.length > 0) {
          switch (status) {
            case 'van_arrived':
              realTimeNotificationService.sendNotification({
                type: 'arrived_at_location',
                title: 'Van Chegou!',
                message: direction === 'to_school' 
                  ? `A van chegou para embarcar ${studentName}` 
                  : `A van chegou para desembarcar ${studentName}`,
                driverId: driver.id,
                driverName: driver.name,
                studentId,
                studentName,
                location: student?.address,
                guardianIds
              });
              break;
            case 'embarked':
              realTimeNotificationService.sendNotification({
                type: 'student_picked_up',
                title: 'Estudante Embarcou',
                message: `${studentName} entrou na van e está a caminho da escola`,
                driverId: driver.id,
                driverName: driver.name,
                studentId,
                studentName,
                guardianIds
              });
              break;
            case 'at_school':
              realTimeNotificationService.sendNotification({
                type: 'student_dropped_off',
                title: 'Chegou na Escola',
                message: `${studentName} chegou na escola com segurança`,
                driverId: driver.id,
                driverName: driver.name,
                studentId,
                studentName,
                guardianIds
              });
              break;
            case 'disembarked':
              // Verificar se é desembarque na escola ou em casa
              if (direction === 'to_school') {
                // Desembarque na escola (ida para escola)
                console.log(`📚 Enviando notificação de chegada na escola para ${studentName}`);
                realTimeNotificationService.sendNotification({
                  type: 'student_dropped_off',
                  title: 'Chegou na Escola',
                  message: `${studentName} chegou na escola com segurança`,
                  driverId: driver.id,
                  driverName: driver.name,
                  studentId,
                  studentName,
                  guardianIds
                });
              } else {
                // Desembarque em casa (volta da escola)
                console.log(`🏠 Enviando notificação de chegada em casa para ${studentName}`);
                realTimeNotificationService.sendNotification({
                  type: 'student_dropped_off',
                  title: 'Estudante Desembarcou',
                  message: `${studentName} desembarcou da van e chegou em casa`,
                  driverId: driver.id,
                  driverName: driver.name,
                  studentId,
                  studentName,
                  guardianIds
                });
              }
              break;
          }
        }
      }
      
      // Notificações legadas removidas para evitar duplicação
    }
  };

  const finishTrip = () => {
    if (activeTrip) {
      // Determinar direção da rota baseado nos estudantes
      const direction = activeTrip.students[0]?.direction || 'to_school';
      const route = routes.find(r => r.id === activeTrip.routeId);
      
      // Enviar notificação em tempo real para todos os responsáveis da rota
      if (route) {
        const allGuardianIds = route.students
          .map(student => guardians.find(g => g.id === student.guardianId && (g.isActive !== false)))
          .filter(Boolean)
          .map(guardian => guardian!.id);

        if (allGuardianIds.length > 0) {
          realTimeNotificationService.sendNotification({
            type: 'route_completed',
            title: 'Rota Concluída',
            message: `${driver.name} finalizou a rota "${route.name}" com sucesso`,
            driverId: driver.id,
            driverName: driver.name,
            guardianIds: allGuardianIds
          });
        }
      }
      
      // Finalizar rota no routeTrackingService para salvar no histórico
      console.log('🏁 Finalizando rota e salvando no histórico...');
      const routeEnded = routeTrackingService.endRoute();
      if (routeEnded) {
        console.log('✅ Rota finalizada e salva no histórico com sucesso');
      } else {
        console.log('⚠️ Nenhuma rota ativa encontrada para finalizar');
      }
      
      // Marcar como completed e finalizar completamente após um delay
      setActiveTrip({ ...activeTrip, status: 'completed' });
      console.log('✅ Rota marcada como concluída');
      
      // Finalizar completamente a viagem após 2 segundos
      setTimeout(() => {
        setActiveTrip(null);
        console.log('🏁 Viagem finalizada completamente');
      }, 2000);
      
      // Limpar notificações para permitir novas notificações na próxima viagem
      setNotifiedGuardians(new Set());
      console.log('🔄 Histórico de notificações limpo - próxima viagem poderá enviar notificações novamente');
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
    toggleStudentDropoffType,
    deleteStudent,
    addGuardian,
    updateGuardian,
    deleteGuardian,
    addSchool,
    updateSchool,
    deleteSchool,
    startTrip,
    updateStudentStatus,
    updateMultipleStudentsStatus,
    finishTrip
  };
};
