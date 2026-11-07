import React, { useState } from 'react';
import { X, Check, Lock, ShieldCheck, QrCode, CreditCard, Sparkles, ArrowRight } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
    }, 1200);
  };

  const resetAndClose = () => {
    setStep('form');
    setFormData({ name: '', email: '', cardNumber: '', cardExpiry: '', cardCvc: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#121212] border border-[#2E2E2E] rounded-3xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-2 text-[#71717A] hover:text-white rounded-full bg-[#181818] border border-[#262626] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'form' ? (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#F59E0B] uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Assinatura Mensal</span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1">
                Ativar UMBRA Daily OS Pro
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Acesso imediato a todas as funcionalidades de planejamento, foco e IA.
              </p>
            </div>

            {/* Price Summary Box */}
            <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Plano Mensal Pro</p>
                <p className="text-xs text-[#71717A]">Sem fidelidade · Cancele quando quiser</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black font-mono text-[#F59E0B]">
                  R$ 9,90
                </p>
                <p className="text-[10px] text-[#A1A1AA]">/ mês</p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'bg-[#1F1F1F] border-[#F59E0B] text-white'
                      : 'bg-[#151515] border-[#262626] text-[#A1A1AA]'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-[#F59E0B]" />
                  <span>Pix Instantâneo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-[#1F1F1F] border-[#F59E0B] text-white'
                      : 'bg-[#151515] border-[#262626] text-[#A1A1AA]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#F59E0B]" />
                  <span>Cartão de Crédito</span>
                </button>
              </div>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Seu Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Alex Santana"
                  className="w-full bg-[#161616] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Seu Melhor E-mail (para login e ativação)
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@exemplo.com"
                  className="w-full bg-[#161616] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      className="w-full bg-[#161616] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Validade (MM/AA)
                      </label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={formData.cardExpiry}
                        onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                        className="w-full bg-[#161616] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={formData.cardCvc}
                        onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value })}
                        className="w-full bg-[#161616] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-extrabold text-sm transition-all duration-200 shadow-lg shadow-[#F59E0B]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processando ativação...</span>
                ) : (
                  <>
                    <span>Confirmar Assinatura (R$ 9,90)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#71717A] pt-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Criptografia de 256 bits · Sem cobranças surpresa</span>
              </div>
            </form>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Assinatura Confirmada
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Bem-vindo ao UMBRA Daily OS!
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-2 max-w-sm mx-auto leading-relaxed">
                Enviamos os dados de ativação e link de acesso direto para <strong className="text-white">{formData.email || 'seu e-mail'}</strong>.
              </p>
            </div>

            <div className="p-4 bg-[#181818] border border-[#282828] rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#71717A]">Plano:</span>
                <span className="text-white font-bold">UMBRA Daily OS Pro</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Valor:</span>
                <span className="text-[#F59E0B] font-mono font-bold">R$ 9,90 / mês</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Status:</span>
                <span className="text-emerald-400 font-mono">Ativo imediatamente</span>
              </div>
            </div>

            <button
              onClick={resetAndClose}
              className="w-full py-3.5 px-6 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-extrabold text-sm transition-all cursor-pointer"
            >
              Acessar Meu Painel Agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
