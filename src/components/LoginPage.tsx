import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onGuardianLogin: (code: string) => void;
  onNavigateToRegister: () => void;
  onForgotPassword: () => void;
  onGoogleLogin: () => void;
}

export const LoginPage = ({ onLogin, onGuardianLogin, onNavigateToRegister, onForgotPassword, onGoogleLogin }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showGuardianCodeDialog, setShowGuardianCodeDialog] = useState(false);
  const [guardianCode, setGuardianCode] = useState('');
  const [guardianCodeError, setGuardianCodeError] = useState('');

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await onGoogleLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuardianAccess = () => {
    setShowGuardianCodeDialog(true);
  };

  const handleGuardianCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guardianCode.trim()) {
      setGuardianCodeError('Código é obrigatório');
      return;
    }

    if (guardianCode.length < 4) {
      setGuardianCodeError('Código deve ter pelo menos 4 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await onGuardianLogin(guardianCode.trim());
      setShowGuardianCodeDialog(false);
      setGuardianCode('');
      setGuardianCodeError('');
    } catch (error: any) {
      if (error.message === 'INACTIVE_GUARDIAN') {
        setGuardianCodeError('Seu acesso foi desativado pelo motorista. Entre em contato com o motorista para reativar.');
      } else if (error.message === 'Código não encontrado') {
        setGuardianCodeError('Código não encontrado. Verifique com o motorista.');
      } else {
        setGuardianCodeError('Código inválido. Verifique com o motorista.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <img src="/vai-mogi.png" alt="VaiMogi" className="w-32 h-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo!</h1>
          <p className="text-gray-600">Entre na sua conta para continuar</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 h-12 border-2 rounded-xl transition-all duration-200 focus:border-orange-500 focus:ring-orange-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 h-12 border-2 rounded-xl transition-all duration-200 focus:border-orange-500 focus:ring-orange-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium text-gray-700">Entrar com Google</span>
              </div>
            </Button>
          </form>

          {/* Guardian Access Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">
                É responsável por um aluno?
              </p>
              <Button
                type="button"
                onClick={handleGuardianAccess}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Acesso para Responsáveis
                </div>
              </Button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-orange-500 hover:text-orange-600 font-semibold transition-colors"
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Guardian Code Dialog */}
      <Dialog open={showGuardianCodeDialog} onOpenChange={setShowGuardianCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-500" />
              Código de Acesso
            </DialogTitle>
            <DialogDescription>
              Digite o código fornecido pelo motorista para acessar o acompanhamento da rota
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardianCodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guardianCode" className="text-sm font-medium text-gray-700">
                Código do Responsável
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="guardianCode"
                  type="text"
                  value={guardianCode}
                  onChange={(e) => {
                    setGuardianCode(e.target.value.toUpperCase());
                    setGuardianCodeError('');
                  }}
                  className={`pl-10 h-12 border-2 rounded-xl transition-all duration-200 focus:border-blue-500 focus:ring-blue-500 text-center font-mono text-lg tracking-wider ${
                    guardianCodeError ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Ex: ABC123"
                  maxLength={10}
                />
              </div>
              {guardianCodeError && (
                <div className="mt-1">
                  <p className="text-red-500 text-sm">{guardianCodeError}</p>
                  {guardianCodeError.includes('desativado') && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">
                        <strong>O que fazer:</strong> Entre em contato com o motorista responsável pela sua rota para solicitar a reativação do seu acesso.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Onde encontrar o código:</strong><br />
                O código é fornecido pelo motorista responsável pela rota do seu filho. 
                Entre em contato com o motorista se não tiver recebido o código.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowGuardianCodeDialog(false);
                  setGuardianCode('');
                  setGuardianCodeError('');
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !guardianCode.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verificando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Acessar
                  </div>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};