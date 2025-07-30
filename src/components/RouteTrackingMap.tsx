import React, { useEffect, useState } from 'react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

interface RouteTrackingMapProps {
  activeRoute: ActiveRoute;
  driverLocation?: RouteLocation;
  nextDestination?: {
    studentId: string;
    studentName: string;
    address: string;
    lat?: number;
    lng: number;
    status: 'pending' | 'picked_up' | 'dropped_off';
  };
}

export const RouteTrackingMap: React.FC<RouteTrackingMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const [mapUrl, setMapUrl] = useState<string>('');
  const [studentHome, setStudentHome] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [schoolLocation, setSchoolLocation] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'to_student' | 'to_school'>('to_student');

  // Carregar dados da escola
  useEffect(() => {
    const loadSchoolData = () => {
      try {
        const savedSchools = localStorage.getItem('schools');
        if (savedSchools) {
          const schools = JSON.parse(savedSchools);
          if (schools.length > 0) {
            const school = schools[0];
            setSchoolLocation({
              lat: school.lat || -23.5558,
              lng: school.lng || -46.6396,
              name: school.name || 'Escola Municipal'
            });
            console.log('🏫 Escola carregada:', school.name);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar escola:', error);
        setSchoolLocation({
          lat: -23.5558,
          lng: -46.6396,
          name: 'Escola'
        });
      }
    };

    loadSchoolData();
  }, []);

  // Carregar dados do estudante (casa)
  useEffect(() => {
    const loadStudentHome = () => {
      try {
        const savedStudents = localStorage.getItem('students');
        if (savedStudents) {
          const students = JSON.parse(savedStudents);
          if (students.length > 0) {
            const student = students[0]; // Primeiro estudante
            setStudentHome({
              lat: student.lat || -23.5475,
              lng: student.lng || -46.6361,
              name: student.name || 'Casa do Aluno'
            });
            console.log('🏠 Casa do aluno carregada:', student.name);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar casa do aluno:', error);
        setStudentHome({
          lat: -23.5475,
          lng: -46.6361,
          name: 'Casa do Aluno'
        });
      }
    };

    loadStudentHome();
  }, []);

  // Determinar fase atual da rota baseada no status dos estudantes
  useEffect(() => {
    if (!activeRoute.studentPickups) return;

    const hasPickedUpStudents = activeRoute.studentPickups.some(s => s.status === 'picked_up');
    const allStudentsPickedUp = activeRoute.studentPickups.every(s => s.status !== 'pending');

    if (hasPickedUpStudents || allStudentsPickedUp) {
      setCurrentPhase('to_school');
      console.log('📚 Fase: Indo para escola');
    } else {
      setCurrentPhase('to_student');
      console.log('🏠 Fase: Indo buscar aluno');
    }
  }, [activeRoute.studentPickups]);

  // Atualizar mapa baseado na fase atual
  useEffect(() => {
    if (!driverLocation || !studentHome || !schoolLocation) return;

    const driverLat = driverLocation.lat;
    const driverLng = driverLocation.lng;
    const studentLat = studentHome.lat;
    const studentLng = studentHome.lng;
    const schoolLat = schoolLocation.lat;
    const schoolLng = schoolLocation.lng;

    let mapUrl = '';

    if (currentPhase === 'to_student') {
      // Fase 1: Motorista → Casa do Aluno
      const minLat = Math.min(driverLat, studentLat) - 0.005;
      const maxLat = Math.max(driverLat, studentLat) + 0.005;
      const minLng = Math.min(driverLng, studentLng) - 0.005;
      const maxLng = Math.max(driverLng, studentLng) + 0.005;
      const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;

      // Marcadores: Motorista + Casa do Aluno
      mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${driverLat},${driverLng}&marker=${studentLat},${studentLng}`;
      
      console.log('🗺️ Mapa: Motorista → Casa do Aluno');
    } else {
      // Fase 2: Motorista → Escola (com aluno embarcado)
      const minLat = Math.min(driverLat, schoolLat) - 0.005;
      const maxLat = Math.max(driverLat, schoolLat) + 0.005;
      const minLng = Math.min(driverLng, schoolLng) - 0.005;
      const maxLng = Math.max(driverLng, schoolLng) + 0.005;
      const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;

      // Marcadores: Motorista + Escola
      mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${driverLat},${driverLng}&marker=${schoolLat},${schoolLng}`;
      
      console.log('🗺️ Mapa: Motorista → Escola');
    }

    setMapUrl(mapUrl);
  }, [driverLocation, studentHome, schoolLocation, currentPhase]);

  if (!driverLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Obtendo localização do motorista...</p>
        </div>
      </div>
    );
  }

  if (!studentHome || !schoolLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando dados da rota...</p>
        </div>
      </div>
    );
  }

  if (!mapUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando trajeto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Mapa com trajeto dinâmico */}
      <iframe
        src={mapUrl}
        className="w-full h-full border-0"
        title={`Trajeto: ${currentPhase === 'to_student' ? 'Buscando Aluno' : 'Indo para Escola'}`}
        loading="lazy"
        style={{ 
          border: 'none',
          outline: 'none'
        }}
      />
    </div>
  );
};