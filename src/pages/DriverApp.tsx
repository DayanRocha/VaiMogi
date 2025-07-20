import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientsPage } from '@/components/ClientsPage';
import { DriversPage } from '@/components/DriversPage';
import { SettingsPage } from '@/components/SettingsPage';
import { DriverProfile } from '@/components/DriverProfile';
import { VanRegistration } from '@/components/VanRegistration';
import { RouteRegistration } from '@/components/RouteRegistration';
import { RoutesList } from '@/components/RoutesList';
import { RoutesListPage } from '@/components/RoutesListPage';
import { RouteFormPage } from '@/components/RouteFormPage';
import { RouteSetupPage } from '@/components/RouteSetupPage';
import { RouteExecutionPage } from '@/components/RouteExecutionPage';
import { StudentsList } from '@/components/StudentsList';
import { StudentRegistration } from '@/components/StudentRegistration';
import { GuardiansList } from '@/components/GuardiansList';
import { GuardianRegistration } from '@/components/GuardianRegistration';
import { GuardianCodesManager } from '@/components/GuardianCodesManager';
import { GuardianStatusManager } from '@/components/GuardianStatusManager';
import { SchoolsList } from '@/components/SchoolsList';
import { SchoolRegistration } from '@/components/SchoolRegistration';
import { ActiveTrip } from '@/components/ActiveTrip';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useDriverData } from '@/hooks/useDriverData';
import { Route, Student, Guardian, School as SchoolType } from '@/types/driver';

export default function DriverApp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [navigationStack, setNavigationStack] = useState<string[]>(['home']);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showGuardianForm, setShowGuardianForm] = useState(false);
  const [showGuardianCodes, setShowGuardianCodes] = useState(false);
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [showClients, setShowClients] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTopButton, setActiveTopButton] = useState<'clients' | 'drivers' | 'settings' | null>(null);

  const [showRoutesListPage, setShowRoutesListPage] = useState(false);
  const [showRouteFormPage, setShowRouteFormPage] = useState(false);
  const [showRouteSetupPage, setShowRouteSetupPage] = useState(false);
  const [showRouteExecutionPage, setShowRouteExecutionPage] = useState(false);
  const [executingRoute, setExecutingRoute] = useState<Route | null>(null);

  const addToNavigationStack = (screen: string) => {
    setNavigationStack(prev => [...prev, screen]);
    // Add to browser history
    window.history.pushState({ screen }, '', '/');
  };

  const handleBackNavigation = () => {
    if (navigationStack.length > 1) {
      const newStack = navigationStack.slice(0, -1);
      const previousScreen = newStack[newStack.length - 1];
      
      setNavigationStack(newStack);
      
      // Reset all states first
      setShowStudentForm(false);
      setShowGuardianForm(false);
      setShowGuardianCodes(false);
      setShowSchoolForm(false);
      setShowRouteForm(false);
      setShowRoutesListPage(false);
      setShowRouteFormPage(false);
      setShowRouteSetupPage(false);
      setShowRouteExecutionPage(false);
      setEditingStudent(null);
      setEditingGuardian(null);
      setEditingSchool(null);
      setEditingRoute(null);
      setExecutingRoute(null);
      setShowClients(false);
      setShowDrivers(false);
      setShowSettings(false);
      setActiveTopButton(null);

      // Navigate to the specific screen
      switch (previousScreen) {
        case 'clients':
          setShowClients(true);
          setActiveTopButton('clients');
          break;
        case 'drivers':
          setShowDrivers(true);
          setActiveTopButton('drivers');
          break;
        case 'settings':
          setShowSettings(true);
          setActiveTopButton('settings');
          break;
        default:
          setActiveTab(previousScreen);
          break;
      }
    }
  };

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      handleBackNavigation();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const {
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
    startTrip,
    updateStudentStatus,
    finishTrip,
    addStudent,
    updateStudent,
    addGuardian,
    updateGuardian,
    addSchool,
    updateSchool
  } = useDriverData();

  const navigateToScreen = (screen: string) => {
    // Reset all states first
    setShowStudentForm(false);
    setShowGuardianForm(false);
    setShowGuardianCodes(false);
    setShowSchoolForm(false);
    setShowRouteForm(false);
    setShowRoutesListPage(false);
    setShowRouteFormPage(false);
    setShowRouteSetupPage(false);
    setShowRouteExecutionPage(false);
    setEditingStudent(null);
    setEditingGuardian(null);
    setEditingSchool(null);
    setEditingRoute(null);
    setExecutingRoute(null);
    setShowClients(false);
    setShowDrivers(false);
    setShowSettings(false);
    setActiveTopButton(null);

    // Navigate to the specific screen
    switch (screen) {
      case 'clients':
        setShowClients(true);
        setActiveTopButton('clients');
        break;
      case 'drivers':
        setShowDrivers(true);
        setActiveTopButton('drivers');
        break;
      case 'settings':
        setShowSettings(true);
        setActiveTopButton('settings');
        break;
      default:
        setActiveTab(screen);
        break;
    }
  };

  const handleTabChange = (tab: string) => {
    addToNavigationStack(tab);
    navigateToScreen(tab);
  };

  const handleBackToHome = () => {
    setNavigationStack(['home']);
    navigateToScreen('home');
  };

  const handleClientsClick = () => {
    addToNavigationStack('clients');
    navigateToScreen('clients');
  };

  const handleDriversClick = () => {
    addToNavigationStack('drivers');
    navigateToScreen('drivers');
  };

  const handleSettingsClick = () => {
    addToNavigationStack('settings');
    navigateToScreen('settings');
  };

  const handleSaveRoute = (routeData: Omit<Route, 'id'>) => {
    if (editingRoute) {
      updateRoute(editingRoute.id, routeData);
      setEditingRoute(null);
    } else {
      addRoute(routeData);
    }
    setShowRouteForm(false);
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setShowRouteForm(true);
  };

  const handleExecuteRoute = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setExecutingRoute(route);
      setShowRouteExecutionPage(true);
    }
  };

  const handleBackFromRouteExecution = () => {
    setShowRouteExecutionPage(false);
    setExecutingRoute(null);
  };

  const handleSaveStudent = (studentData: {
    name: string;
    address: string;
    schoolId: string;
    guardianId: string;
    guardianPhone: string;
    guardianEmail: string;
  }) => {
    if (editingStudent) {
      updateStudent(editingStudent.id, studentData);
      setEditingStudent(null);
    } else {
      addStudent(studentData);
    }
    setShowStudentForm(false);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowStudentForm(true);
    addToNavigationStack('student-form');
  };

  const handleSaveGuardian = (guardianData: { name: string; email: string; phone: string }) => {
    if (editingGuardian) {
      updateGuardian(editingGuardian.id, guardianData);
      setEditingGuardian(null);
    } else {
      addGuardian(guardianData);
    }
    setShowGuardianForm(false);
  };

  const handleEditGuardian = (guardian: Guardian) => {
    setEditingGuardian(guardian);
    setShowGuardianForm(true);
    addToNavigationStack('guardian-form');
  };

  const handleSaveSchool = (schoolData: { name: string; address: string }) => {
    if (editingSchool) {
      updateSchool(editingSchool.id, schoolData);
      setEditingSchool(null);
    } else {
      addSchool(schoolData);
    }
    setShowSchoolForm(false);
  };

  const handleEditSchool = (school: SchoolType) => {
    setEditingSchool(school);
    setShowSchoolForm(true);
    addToNavigationStack('school-form');
  };

  const handleRoutesListBack = () => {
    setShowRoutesListPage(false);
    setActiveTab('home');
  };

  const handleCreateRoute = () => {
    setShowRoutesListPage(false);
    setShowRouteFormPage(true);
  };

  const handleRouteFormBack = () => {
    setShowRouteFormPage(false);
    setShowRoutesListPage(true);
  };

  const handleRouteFormNext = () => {
    setShowRouteFormPage(false);
    setShowRouteSetupPage(true);
  };

  const handleRouteSetupBack = () => {
    setShowRouteSetupPage(false);
    setShowRouteFormPage(true);
  };

  const handleRouteSetupSave = () => {
    setShowRouteSetupPage(false);
    setShowRoutesListPage(true);
    console.log('🚐 Rota cadastrada com sucesso! Redirecionando para "suas rotas"...');
  };

  const renderContent = () => {
    if (showRouteExecutionPage) {
      return (
        <RouteExecutionPage
          route={executingRoute}
          students={students}
          schools={schools}
          onBack={handleBackFromRouteExecution}
          onAddStudent={() => setShowStudentForm(true)}
          onAddSchool={() => setShowSchoolForm(true)}
          onRemoveStudent={(studentId) => console.log('Remove student:', studentId)}
        />
      );
    }

    if (showRoutesListPage) {
      return (
        <RoutesListPage
          onBack={handleRoutesListBack}
          onCreateRoute={handleCreateRoute}
          onActiveRoutes={() => {}}
          onRouteHistory={() => {}}
        />
      );
    }

    if (showRouteFormPage) {
      return (
        <RouteFormPage
          onBack={handleRouteFormBack}
          onNext={handleRouteFormNext}
        />
      );
    }

    if (showRouteSetupPage) {
      return (
        <RouteSetupPage
          onBack={handleRouteSetupBack}
          onSave={handleRouteSetupSave}
          onAddStudent={() => {}}
          onAddSchool={() => {}}
          students={students}
          schools={schools}
        />
      );
    }

    if (showClients) {
      return (
        <ClientsPage 
          onTabChange={handleTabChange} 
          onBack={handleBackToHome}
          onClientsClick={handleClientsClick}
          onDriversClick={handleDriversClick}
          onSettingsClick={handleSettingsClick}
          activeTopButton={activeTopButton}
        />
      );
    }

    if (showDrivers) {
      return (
        <DriversPage 
          onTabChange={handleTabChange} 
          onBack={handleBackToHome}
          onClientsClick={handleClientsClick}
          onDriversClick={handleDriversClick}
          onSettingsClick={handleSettingsClick}
          activeTopButton={activeTopButton}
        />
      );
    }

    if (showSettings) {
      return (
        <SettingsPage 
          onTabChange={handleTabChange} 
          onBack={handleBackToHome}
          onClientsClick={handleClientsClick}
          onDriversClick={handleDriversClick}
          onSettingsClick={handleSettingsClick}
          activeTopButton={activeTopButton}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <ClientsPage 
            onTabChange={handleTabChange} 
            onBack={handleBackToHome}
            onClientsClick={handleClientsClick} 
            onDriversClick={handleDriversClick}
            onSettingsClick={handleSettingsClick}
            activeTopButton={activeTopButton}
          />
        );
        
      case 'profile':
        return <DriverProfile driver={driver} onUpdate={updateDriver} onBack={handleBackNavigation} />;
        
      case 'van':
        return <VanRegistration van={van} onUpdate={updateVan} onBack={handleBackNavigation} />;
        
      case 'routes':
        if (showRouteForm || editingRoute) {
          return (
            <RouteRegistration
              onSave={handleSaveRoute}
              driverId={driver.id}
              students={students}
              schools={schools}
              editingRoute={editingRoute}
              onBack={() => {
                setShowRouteForm(false);
                setEditingRoute(null);
                handleBackNavigation();
              }}
            />
          );
        }
        return (
          <div>
            <RoutesList
              routes={routes}
              onEdit={handleEditRoute}
              onStart={startTrip}
              onDelete={deleteRoute}
              hasActiveTrip={!!activeTrip}
              onBack={handleBackNavigation}
              onExecuteRoute={handleExecuteRoute}
            />
            <div className="fixed bottom-4 right-4">
              <button
                onClick={() => {
                  setShowRouteForm(true);
                  addToNavigationStack('route-form');
                }}
                className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
              >
                <span className="text-2xl">+</span>
              </button>
            </div>
          </div>
        );
        
      case 'students':
        if (showStudentForm) {
          return (
            <StudentRegistration
              schools={schools}
              guardians={guardians}
              onSave={handleSaveStudent}
              onBack={() => {
                setShowStudentForm(false);
                setEditingStudent(null);
                handleBackNavigation();
              }}
              editingStudent={editingStudent}
            />
          );
        }
        return (
          <StudentsList 
            students={students} 
            schools={schools} 
            onBack={handleBackNavigation}
            onAddStudent={() => {
              setShowStudentForm(true);
              addToNavigationStack('student-form');
            }}
            onEditStudent={handleEditStudent}
          />
        );
        
      case 'guardians':
        if (showGuardianForm) {
          return (
            <GuardianRegistration
              onSave={handleSaveGuardian}
              onBack={() => {
                setShowGuardianForm(false);
                setEditingGuardian(null);
                handleBackNavigation();
              }}
              editingGuardian={editingGuardian}
            />
          );
        }
        return (
          <GuardiansList 
            guardians={guardians} 
            onBack={handleBackNavigation}
            onAddGuardian={() => {
              setShowGuardianForm(true);
              addToNavigationStack('guardian-form');
            }}
            onEditGuardian={handleEditGuardian}
          />
        );
        
      case 'guardian-codes':
        return (
          <GuardianCodesManager
            guardians={guardians}
            onBack={handleBackNavigation}
            onUpdateGuardian={updateGuardian}
          />
        );
        
      case 'guardian-status':
        return (
          <GuardianStatusManager
            guardians={guardians}
            onBack={handleBackNavigation}
            onUpdateGuardian={updateGuardian}
          />
        );
        
      case 'schools':
        if (showSchoolForm) {
          return (
            <SchoolRegistration
              onSave={handleSaveSchool}
              onBack={() => {
                setShowSchoolForm(false);
                setEditingSchool(null);
                handleBackNavigation();
              }}
              editingSchool={editingSchool}
            />
          );
        }
        return (
          <SchoolsList 
            schools={schools} 
            onBack={handleBackNavigation}
            onAddSchool={() => {
              setShowSchoolForm(true);
              addToNavigationStack('school-form');
            }}
            onEditSchool={handleEditSchool}
          />
        );
        
      case 'trip':
        return (
          <ActiveTrip
            trip={activeTrip}
            students={students}
            schools={schools}
            onUpdateStudentStatus={updateStudentStatus}
            onFinishTrip={finishTrip}
            onBack={handleBackNavigation}
          />
        );
        
      default:
        return (
          <ClientsPage 
            onTabChange={handleTabChange} 
            onBack={handleBackToHome}
            onClientsClick={handleClientsClick} 
            onDriversClick={handleDriversClick}
            onSettingsClick={handleSettingsClick}
            activeTopButton={activeTopButton}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20">
        {renderContent()}
      </div>
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        hasActiveTrip={!!activeTrip}
      />
    </div>
  );
}
