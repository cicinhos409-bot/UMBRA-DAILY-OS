import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from './AuthLayout';

interface SignupPageProps {
  onBack: () => void;
  onSwitchPage: (page: 'login' | 'signup') => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSwitchPage }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('A criação de contas ainda não está conectada a um serviço de autenticação.');
  };

  return (
    <AuthLayout
      eyebrow="Comece por aqui"
      title="Crie sua conta."
      description="Prepare seu espaço e dê o primeiro passo para uma rotina com mais foco."
      footerText="Já tem uma conta?"
      footerAction="Entrar"
      onBack={onBack}
      onSwitchPage={() => onSwitchPage('login')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="mb-2 block text-sm font-medium text-[#D4D4D8]">
            Como podemos te chamar?
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
            className="w-full rounded-xl border border-[#2A2A2A] bg-[#161616] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#52525B] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/10"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-[#D4D4D8]">
            E-mail
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-[#D4D4D8]">
            Senha <span className="font-normal text-[#71717A]">(mínimo de 8 caracteres)</span>
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Crie uma senha segura"
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
          Criar minha conta
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthLayout>
  );
};
