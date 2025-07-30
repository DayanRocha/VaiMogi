import { useState, useEffect } from 'react';
import { Driver, Van, Student, Trip, Guardian } from '@/types/driver';
import { notificationService } from '@/services/notificationService';
import { audioService, NotificationSoundType } from '@/services/audioService';
import { routeTrackingService } from '@/services/routeTrackingService';

export interface GuardianNotification {
  id: string;
  type: 'van_arrived' | 'embarked' | 'at_school' | 'disembarked';
  studentName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

// Função para carregar dados do responsável logado
const getLoggedGuardian = (): Guardian => {
  const savedGuardianData = localStorage.getItem('guardianData');
  
  if (savedGuardianData) {
    try {
      const guardianData = JSON.parse(savedGuardianData);
      return {
        id: guardianData.id || '1',
        name: guardianData.name || 'Responsável',
        email: guardianData.email || '',
        phone: guardianData.phone || '',
        uniqueCode: guardianData.code || '',
        codeGeneratedAt: guardianData.codeGeneratedAt,
        isActive: true
      };
    } catch (error) {
      console.error('Erro ao carregar dados do responsável:', error);
    }
  }
  
  // Fallback para dados mock
  return {
    id: '1',
    name: 'Maria Silva',
    email: 'maria.silva@email.com',
    phone: '(11) 98765-4321',
    uniqueCode: 'MS2024',
    isActive: true
  };
};

// Função para buscar dados do motorista do localStorage
const getDriverData = (guardianId: string): Driver => {
  // Primeiro tentar buscar dados individuais do motorista
  const savedDriverData = localStorage.getItem('driverData');
  const savedDrivers = localStorage.getItem('drivers');
  
  console.log('🔍 Buscando dados do motorista para responsável:', guardianId);
  console.log('🔍 DriverData encontrado:', !!savedDriverData);
  console.log('🔍 Drivers encontrado:', !!savedDrivers);
  
  // Primeiro tentar driverData (dados individuais)
  if (savedDriverData) {
    try {
      const driverData = JSON.parse(savedDriverData);
      console.log('📊 Dados do motorista individual:', driverData);
      
      // Converter para formato Driver se necessário
      const driver: Driver = {
        id: driverData.id || '1',
        name: driverData.name || 'Motorista',
        email: driverData.email || '',
        phone: driverData.phone || '',
        address: driverData.address || '',
        photo: driverData.photo || '/placeholder.svg'
      };
      
      console.log('✅ Motorista encontrado (individual):', driver.name);
      return driver;
    } catch (error) {
      console.error('❌ Erro ao carregar driverData:', error);
    }
  }
  
  // Se não encontrou individual, tentar lista de drivers
  if (savedDrivers) {
    try {
      const drivers = JSON.parse(savedDrivers);
      console.log('📊 Motoristas disponíveis:', drivers.length);
      console.log('📊 Dados dos motoristas:', drivers);
      
      if (drivers.length > 0) {
        // Primeiro, tentar encontrar por associação com estudantes/rotas
        const savedStudents = localStorage.getItem('students');
        if (savedStudents) {
          const students = JSON.parse(savedStudents);
          console.log('👥 Estudantes cadastrados:', students.length);
          
          // Encontrar estudantes do responsável
          const guardianStudents = students.filter((s: Student) => s.guardianId === guardianId);
          console.log('👶 Estudantes do responsável:', guardianStudents.length);
          
          if (guardianStudents.length > 0) {
            // Buscar rotas que contenham esses estudantes
            const savedRoutes = localStorage.getItem('routes');
            if (savedRoutes) {
              const routes = JSON.parse(savedRoutes);
              console.log('🛣️ Rotas disponíveis:', routes.length);
              
              // Encontrar rota que contém os estudantes do responsável
              const relevantRoute = routes.find((route: any) => 
                route.students && route.students.some((routeStudent: any) => 
                  guardianStudents.some(gs => gs.id === routeStudent.id)
                )
              );
              
              if (relevantRoute) {
                console.log('✅ Rota encontrada:', relevantRoute.name, 'Motorista ID:', relevantRoute.driverId);
                
                // Encontrar o motorista dessa rota
                const driver = drivers.find((d: Driver) => d.id === relevantRoute.driverId);
                if (driver) {
                  console.log('🚗 Motorista encontrado por rota:', driver.name);
                  return driver;
                }
              }
            }
          }
        }
        
        // Se não encontrou por rota, pegar o primeiro motorista disponível
        const driver = drivers[0];
        console.log('⚠️ Usando primeiro motorista disponível:', driver.name);
        return driver;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do motorista:', error);
    }
  } else {
    console.log('❌ Nenhum motorista encontrado no localStorage');
  }
  
  console.log('🔄 Usando dados mock do motorista');
  // Fallback para dados mock
  return {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    photo: '/placeholder.svg'
  };
};

// Função para buscar dados da van do localStorage
const getVanData = (driverId: string): Van => {
  console.log('🚐 Buscando van do motorista:', driverId);
  
  // A van pode estar salva junto com os dados do motorista ou separadamente
  // Primeiro, verificar se há dados da van no useDriverData (que usa mockVan)
  const savedDriverData = localStorage.getItem('driverData');
  if (savedDriverData) {
    try {
      const driverData = JSON.parse(savedDriverData);
      // Se o driver tem uma van associada, usar ela
      if (driverData.van) {
        console.log('✅ Van encontrada nos dados do motorista:', driverData.van.model);
        return {
          id: driverData.van.id || '1',
          driverId: driverId,
          model: driverData.van.model || 'Modelo não informado',
          plate: driverData.van.plate || 'Placa não informada',
          capacity: driverData.van.capacity || 0,
          observations: driverData.van.observations || '',
          photo: driverData.van.photo || '/placeholder.svg'
        };
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados da van do motorista:', error);
    }
  }
  
  // Tentar buscar em lista de vans
  const savedVans = localStorage.getItem('vans');
  if (savedVans) {
    try {
      const vans = JSON.parse(savedVans);
      console.log('🚐 Vans disponíveis:', vans.length);
      console.log('🚐 Dados das vans:', vans);
      
      // Buscar van do motorista específico
      const van = vans.find((v: Van) => v.driverId === driverId);
      if (van) {
        console.log('✅ Van encontrada na lista:', van.model, van.plate);
        return {
          id: van.id,
          driverId: van.driverId,
          model: van.model || 'Modelo não informado',
          plate: van.plate || 'Placa não informada',
          capacity: van.capacity || 0,
          observations: van.observations || '',
          photo: van.photo || '/placeholder.svg'
        };
      } else {
        console.log('⚠️ Van não encontrada para motorista específico:', driverId);
        
        // Se não encontrou van específica, pegar a primeira disponível
        if (vans.length > 0) {
          const firstVan = vans[0];
          console.log('⚠️ Usando primeira van disponível:', firstVan.model);
          return {
            id: firstVan.id,
            driverId: firstVan.driverId,
            model: firstVan.model || 'Modelo não informado',
            plate: firstVan.plate || 'Placa não informada',
            capacity: firstVan.capacity || 0,
            observations: firstVan.observations || '',
            photo: firstVan.photo || '/placeholder.svg'
          };
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados da van:', error);
    }
  } else {
    console.log('❌ Nenhuma van encontrada no localStorage');
  }
  
  console.log('🔄 Usando dados mock da van');
  // Fallback para dados mock
  return {
    id: '1',
    driverId: driverId,
    model: 'Mercedes Sprinter',
    plate: 'ABC-1234',
    capacity: 20,
    observations: 'Van escolar equipada com cintos de segurança',
    photo: '/placeholder.svg'
  };
};

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Pedro Silva',
    address: 'Rua das Palmeiras, 456',
    guardianId: '1',
    guardianPhone: '(11) 98765-4321',
    guardianEmail: 'maria.silva@email.com',
    pickupPoint: 'Rua das Palmeiras, 456 - São Paulo, SP',
    schoolId: '1',
    status: 'waiting',
    dropoffLocation: 'school'
  }
];

const mockNotifications: GuardianNotification[] = [
  {
    id: '1',
    type: 'van_arrived',
    studentName: 'Pedro Silva',
    message: 'A van chegou no ponto de embarque de Pedro Silva',
    timestamp: new Date().toISOString(),
    isRead: false,
    location: { lat: -23.550520, lng: -46.633308 }
  },
  {
    id: '2',
    type: 'embarked',
    studentName: 'Pedro Silva',
    message: 'Pedro Silva embarcou na van e está a caminho da escola',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    isRead: false,
    location: { lat: -23.550520, lng: -46.633308 }
  }
];

// Função para buscar filhos do responsável logado
const getGuardianChildren = (guardianId: string): Student[] => {
  const savedStudents = localStorage.getItem('students');
  
  if (savedStudents) {
    try {
      const students = JSON.parse(savedStudents);
      return students.filter((student: Student) => student.guardianId === guardianId);
    } catch (error) {
      console.error('Erro ao carregar estudantes:', error);
    }
  }
  
  // Fallback para dados mock filtrados pelo guardianId
  return mockStudents.filter(student => student.guardianId === guardianId);
};

// Função para buscar escolas do localStorage
const getSchools = () => {
  const savedSchools = localStorage.getItem('schools');
  
  console.log('🏫 Buscando escolas no localStorage...');
  
  if (savedSchools) {
    try {
      const schools = JSON.parse(savedSchools);
      console.log('🏫 Escolas encontradas:', schools.length);
      console.log('🏫 Dados das escolas:', schools);
      return schools;
    } catch (error) {
      console.error('❌ Erro ao carregar escolas:', error);
    }
  } else {
    console.log('❌ Nenhuma escola encontrada no localStorage');
  }
  
  console.log('🔄 Usando dados mock das escolas');
  // Fallback para dados mock
  return [
    { id: '1', name: 'Escola Municipal João Silva', address: 'Rua da Escola, 100' },
    { id: '2', name: 'Colégio Estadual Maria Santos', address: 'Av. Educação, 200' }
  ];
};

export const useGuardianData = () => {
  const guardian = getLoggedGuardian();
  
  // Debug: mostrar dados do guardian
  console.log('👤 Guardian logado:', guardian);
  
  const [driver, setDriver] = useState<Driver>(() => {
    const driverData = getDriverData(guardian.id);
    console.log('🚗 Driver inicial:', driverData);
    return driverData;
  });
  
  const [van, setVan] = useState<Van>(() => {
    const initialDriver = getDriverData(guardian.id);
    const vanData = getVanData(initialDriver.id);
    console.log('🚐 Van inicial:', vanData);
    return vanData;
  });
  
  const [students, setStudents] = useState<Student[]>(() => getGuardianChildren(guardian.id));
  const [schools, setSchools] = useState(() => getSchools());
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [notifications, setNotifications] = useState<GuardianNotification[]>(() => {
    // Carregar notificações reais do localStorage
    const storedNotifications = notificationService.getStoredNotifications();
    console.log('📱 Notificações carregadas do localStorage:', storedNotifications.length);
    return storedNotifications;
  });

  // Atualizar dados quando houver mudanças no localStorage
  useEffect(() => {
    const updateData = () => {
      const newDriver = getDriverData(guardian.id);
      const newVan = getVanData(newDriver.id);
      const newStudents = getGuardianChildren(guardian.id);
      const newSchools = getSchools();
      
      setDriver(newDriver);
      setVan(newVan);
      setStudents(newStudents);
      setSchools(newSchools);
    };

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'drivers' || e.key === 'vans' || e.key === 'students' || e.key === 'schools') {
        updateData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Também verificar periodicamente para mudanças na mesma aba
    const interval = setInterval(updateData, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [guardian.id]);

  // Escutar notificações reais do serviço
  useEffect(() => {
    const handleNewNotification = async (notification: GuardianNotification) => {
      console.log('📱 Nova notificação recebida:', notification);
      setNotifications(prev => [notification, ...prev]);
      
      // Reproduzir som da buzina ao receber notificação
      try {
        const soundType: NotificationSoundType = notification.type as NotificationSoundType;
        console.log('🔊 Tentando reproduzir som para tipo:', soundType); // Adicione este log
        await audioService.playNotificationSound(soundType);
        console.log('✅ Som reproduzido com sucesso'); // Adicione este log
      } catch (error) {
        console.error('❌ Erro ao reproduzir som:', error);
      }
    };
  
    // Registrar listener para novas notificações
    notificationService.addListener(handleNewNotification);
  
    // Cleanup: remover listener quando componente for desmontado
    return () => {
      notificationService.removeListener(handleNewNotification);
    };
  }, []);

  const markNotificationAsRead = (notificationId: string) => {
    // Marcar como lida no serviço (localStorage)
    notificationService.markAsRead(notificationId);
    
    // Atualizar estado local
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    // Excluir no serviço (localStorage)
    notificationService.deleteNotification(notificationId);
    
    // Atualizar estado local
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const deleteNotifications = (notificationIds: string[]) => {
    // Excluir múltiplas no serviço (localStorage)
    notificationService.deleteNotifications(notificationIds);
    
    // Atualizar estado local
    setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  return {
    guardian,
    driver,
    van,
    students,
    schools,
    activeTrip,
    notifications,
    markNotificationAsRead,
    deleteNotification,
    deleteNotifications,
    getUnreadCount
  };
};