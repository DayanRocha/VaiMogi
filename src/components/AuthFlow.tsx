import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

type AuthView = 'login' | 'register';

export const AuthFlow = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Função de login
  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica de autenticação
      console.log('Login attempt:', { email, password });
      
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Em caso de sucesso, redirecionar para o aplicativo principal
      alert('Login realizado com sucesso!');
      navigate('/');
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
      
      // Em caso de sucesso, redirecionar para o aplicativo principal
      alert('Cadastro realizado com sucesso!');
      navigate('/');
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
      
      alert('Autenticação com Google realizada com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro na autenticação com Google:', error);
      alert('Erro ao autenticar com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para recuperação de senha
  const handleForgotPassword = async (email: string) => {
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
    <RegisterPage
      onRegister={handleRegister}
      onNavigateToLogin={() => setCurrentView('login')}
      onGoogleRegister={handleGoogleAuth}
    />
  );
};