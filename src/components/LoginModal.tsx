import React, { useState } from 'react';
import { X, Lock, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onOpenCheckout }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsLogged(true);
    }, 1000);
  };

  const handleReset = () => {
    setIsLogged(false);
    setEmail('');
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121212] border border-[#2E2E2E] rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 text-[#71717A] hover:text-white rounded-full bg-[#181818] border border-[#262626] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {!isLogged ? (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase">
                Acesso de Membro
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Entrar no UMBRA OS
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Digite seus dados de assinante para acessar seu workspace.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@exemplo.com"
                  className="w-full bg-[#161616] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#A1A1AA]">
                    Senha
                  </label>
                  <a href="#" className="text-[11px] text-[#F59E0B] hover:underline">
                    Esqueceu?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#161616] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-extrabold text-sm transition-all duration-200 shadow-md shadow-[#F59E0B]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Conectando...</span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#222222] text-center text-xs text-[#71717A]">
              <span>Ainda não possui uma conta? </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenCheckout();
                }}
                className="text-[#F59E0B] hover:underline font-bold cursor-pointer"
              >
                Assine por R$ 9,90/mês
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-xl font-bold text-white">Sessão Iniciada com Sucesso</h3>
            <p className="text-xs text-[#A1A1AA]">
              Bem-vindo de volta! Carregando suas 3 prioridades do dia...
            </p>
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl bg-[#1F1F1F] text-white text-xs font-bold border border-[#333333] hover:bg-[#282828] cursor-pointer"
            >
              Fechar Janela
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
