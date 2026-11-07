import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from './AuthLayout';

interface LoginPageProps {
  onBack: () => void;
  onSwitchPage: (page: 'login' | 'signup') => void;
  onEnterDashboard: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSwitchPage, onEnterDashboard }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('O login ainda não está conectado a um serviço de autenticação.');
  };

  return (
    <AuthLayout
      eyebrow="Acesso de membro"
      title="Que bom ter você de volta."
      description="Entre na sua conta para continuar avançando nas prioridades do dia."
      footerText="Ainda não tem uma conta?"
      footerAction="Criar conta"
      onBack={onBack}
      onSwitchPage={() => onSwitchPage('signup')}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#D4D4D8]">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            className="w-full rounded-xl border border-[#2A2A2A] bg-[#161616] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#52525B] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/10"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-[#D4D4D8]">
              Senha
            </label>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#161616] px-4 py-3 pr-12 text-sm text-white outline-none transition-colors placeholder:text-[#52525B] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-[#71717A] transition-colors hover:text-white"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {message && (
          <p role="status" className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-sm leading-5 text-amber-200">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-3.5 text-sm font-bold text-black shadow-lg shadow-[#F59E0B]/15 transition-colors hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]"
        >
          Entrar na minha conta
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
        <p className="text-[11px] leading-5 text-[#A1A1AA]">
          Ainda sem autenticação configurada? Você pode explorar o painel com dados locais neste dispositivo.
        </p>
        <button
          type="button"
          onClick={onEnterDashboard}
          className="mt-2 text-xs font-semibold text-[#FBBF24] transition-colors hover:text-white"
        >
          Abrir dashboard em modo local
        </button>
      </div>
    </AuthLayout>
  );
};
