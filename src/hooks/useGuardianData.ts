import { useState, useEffect } from 'react';
import { Driver, Van, Student, Trip, Guardian } from '@/types/driver';

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
  model: 'Mercedes Sprinter',
  plate: 'ABC-1234',
  capacity: 20,
  observations: 'Van escolar equipada com cintos de segurança',
  photo: '/placeholder.svg'
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
  
  if (savedSchools) {
    try {
      return JSON.parse(savedSchools);
    } catch (error) {
      console.error('Erro ao carregar escolas:', error);
    }
  }
  
  // Fallback para dados mock
  return [
    { id: '1', name: 'Escola Municipal João Silva', address: 'Rua da Escola, 100' },
    { id: '2', name: 'Colégio Estadual Maria Santos', address: 'Av. Educação, 200' }
  ];
};

export const useGuardianData = () => {
  const guardian = getLoggedGuardian();
  const [driver] = useState<Driver>(mockDriver);
  const [van] = useState<Van>(mockVan);
  const [students] = useState<Student[]>(getGuardianChildren(guardian.id));
  const [schools] = useState(getSchools());
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [notifications, setNotifications] = useState<GuardianNotification[]>(mockNotifications);

  // Simular atualizações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular novas notificações ocasionalmente
      if (Math.random() > 0.95) {
        const newNotification: GuardianNotification = {
          id: Date.now().toString(),
          type: 'at_school',
          studentName: 'Pedro Silva',
          message: 'Pedro Silva chegou na escola',
          timestamp: new Date().toISOString(),
          isRead: false,
          location: { lat: -23.555520, lng: -46.638308 }
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
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
    getUnreadCount
  };
};