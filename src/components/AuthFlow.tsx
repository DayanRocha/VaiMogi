import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { WelcomeDialog } from './WelcomeDialog';

type AuthView = 'login' | 'register';

export const AuthFlow = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [driverName, setDriverName] = useState<string>('');
  const navigate = useNavigate();

  // Função de login
  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica de autenticação
      console.log('Login attempt:', { email, password });
      
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se é o primeiro login (simulado)
      const isFirstLogin = !localStorage.getItem('hasLoggedInBefore');
      
      if (isFirstLogin) {
        localStorage.setItem('hasLoggedInBefore', 'true');
        setDriverName(email.split('@')[0]); // Use parte do email como nome temporário
        setShowWelcome(true);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função de cadastro
  const handleRegister = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica de cadastro
      console.log('Register attempt:', { name, email, password });
      
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Primeiro cadastro sempre mostra boas-vindas
      setDriverName(name);
      setShowWelcome(true);
      localStorage.setItem('hasLoggedInBefore', 'true');
    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função de login/cadastro com Google
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a integração com Google OAuth
      console.log('Google auth attempt');
      
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verificar se é o primeiro login Google (simulado)
      const isFirstLogin = !localStorage.getItem('hasLoggedInBefore');
      
      if (isFirstLogin) {
        localStorage.setItem('hasLoggedInBefore', 'true');
        setDriverName('Motorista'); // Nome genérico para Google auth
        setShowWelcome(true);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro na autenticação com Google:', error);
      alert('Erro ao autenticar com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para recuperação de senha
  const handleForgotPassword = async () => {
    // Aqui você pode implementar um diálogo para coletar o email
    const email = prompt('Digite seu e-mail para recuperação:');
    if (!email) return;
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica de recuperação de senha
      console.log('Forgot password for:', email);
      
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('E-mail de recuperação enviado!');
    } catch (error) {
      console.error('Erro ao enviar e-mail de recuperação:', error);
      alert('Erro ao enviar e-mail de recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onNavigateToRegister={() => setCurrentView('register')}
        onForgotPassword={handleForgotPassword}
        onGoogleLogin={handleGoogleAuth}
      />
    );
  }

  return (
    <>
      <RegisterPage
        onRegister={handleRegister}
        onNavigateToLogin={() => setCurrentView('login')}
        onGoogleRegister={handleGoogleAuth}
      />
      
      <WelcomeDialog
        isOpen={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          navigate('/');
        }}
        driverName={driverName}
      />
    </>
  );
};