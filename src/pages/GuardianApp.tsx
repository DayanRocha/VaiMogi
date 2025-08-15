
import React, { useState, useEffect } from 'react';
import GuardianMapView from '@/components/GuardianMapView';
import { Driver, Van, Student, ActiveTrip } from '@/types/driver';
import { useNavigate } from 'react-router-dom'; // Changed from Next.js router
import { WelcomeDialog } from '@/components/WelcomeDialog';

const GuardianApp: React.FC = () => {
  const navigate = useNavigate(); // Changed from useRouter
  const [driver, setDriver] = useState<Driver | null>(null);
  const [van, setVan] = useState<Van | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [guardianId, setGuardianId] = useState<string | null>(null);
  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false);

  useEffect(() => {
    // Mock authentication check - replace with your auth logic
    const mockUser = { uid: 'guardian-123' };
    
    if (mockUser) {
      // Mock data for driver, van, students, and activeTrip
      const mockDriver: Driver = {
        id: 'driver-123',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '123-456-7890',
        address: 'Rua dos Motoristas, 42',
        photo: '/driver-photo.jpg'
      };

      const mockVan: Van = {
        id: 'van-789',
        driverId: 'driver-123',
        model: 'Sprinter Escolar',
        plate: 'ABC-1234',
        capacity: 15,
        observations: 'Ar condicionado e cinto de segurança em todos os assentos',
        photo: '/van-photo.jpg',
        drivingAuthorization: '/driving-auth.pdf'
      };

      const mockStudents: Student[] = [
        {
          id: 'student-1',
          name: 'Maria Eduarda',
          address: 'Rua das Flores, 123',
          guardianId: mockUser.uid,
          guardianPhone: '987-654-3210',
          guardianEmail: 'mae.duda@example.com',
          pickupPoint: 'Em frente ao portão',
          schoolId: 'school-1',
          status: 'waiting',
          dropoffLocation: 'home'
        },
        {
          id: 'student-2',
          name: 'José Carlos',
          address: 'Avenida Principal, 456',
          guardianId: mockUser.uid,
          guardianPhone: '987-654-3210',
          guardianEmail: 'pai.ze@example.com',
          pickupPoint: 'Na esquina',
          schoolId: 'school-2',
          status: 'waiting',
          dropoffLocation: 'school'
        }
      ];

      // Mock active trip data with required driverId property
      const mockActiveTrip: ActiveTrip = {
        id: '1',
        routeId: 'route-1',
        driverId: 'driver-123',
        date: new Date().toISOString().split('T')[0],
        status: 'in_progress',
        students: [
          {
            studentId: 'student-1',
            status: 'embarked',
            direction: 'to_school'
          }
        ]
      };

      setDriver(mockDriver);
      setVan(mockVan);
      setStudents(mockStudents);
      setActiveTrip(mockActiveTrip);
      setGuardianId(mockUser.uid);

      // Check if it's the user's first login
      const firstLogin = localStorage.getItem('firstLogin');
      if (!firstLogin) {
        setIsWelcomeDialogOpen(true);
        localStorage.setItem('firstLogin', 'false');
      }
    } else {
      // Redirect to login if no user is authenticated
      navigate('/auth');
    }
  }, [navigate]);

  const handleWelcomeDialogClose = () => {
    setIsWelcomeDialogOpen(false);
  };

  if (!guardianId || !driver || !van || !students || !activeTrip) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="w-full h-screen">
      <GuardianMapView
        driver={driver}
        van={van}
        students={students}
        activeTrip={activeTrip}
        guardianId={guardianId}
      />

      <WelcomeDialog
        isOpen={isWelcomeDialogOpen}
        onClose={handleWelcomeDialogClose}
        driverName={driver.name}
      />
    </div>
  );
};

export default GuardianApp;
