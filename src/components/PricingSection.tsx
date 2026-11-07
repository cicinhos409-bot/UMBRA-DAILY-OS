import React from 'react';
import { Check, ArrowRight, Lock } from 'lucide-react';
import { SpotlightCard } from './motion/SpotlightCard';
import { MagneticButton } from './motion/MagneticButton';
import { ScrollReveal } from './motion/ScrollReveal';
import { useSound } from '../hooks/useSound';

interface PricingSectionProps {
  onOpenCheckout: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenCheckout }) => {
  const { playClick } = useSound();

  const planFeatures = [
    'Planejamento diário (Missão & 3 Prioridades)',
    'Dashboard inteligente de alta clareza',
    'Gestão completa de tarefas e pendências',
    'Gestão de projetos e metas trimestrais',
    'Focus Timer com modo Deep Work (25/50m)',
    'Cofre de ideias com captura em 1 clique',
    'Checklist matinal blindado contra distrações',
    'Métricas diárias e horas líquidas de foco',
    'Daily AI (sugestões e micro-ações de 5 minutos)',
    'Histórico permanente de execução',
    'Revisão diária guiada de fechamento',
    'Acesso a todas as futuras atualizações da plataforma',
  ];

  return (
    <section id="precos" className="py-24 bg-[#0A0A0A] border-t border-[#1F1F1F] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#F59E0B]/10 blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#F59E0B] mb-3">
              Transparência e acessibilidade
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Organize sua vida por menos de R$ 0,34 por dia.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#A1A1AA]">
              Um sistema completo para planejar, organizar e executar sua rotina.
            </p>
          </div>
        </ScrollReveal>

        {/* Pricing Card with Spotlight and Animated Glow */}
        <div className="mt-14 max-w-xl mx-auto">
          <ScrollReveal delay={150}>
            <div className="relative">
              {/* Outer pulsing glow frame */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#F59E0B]/30 via-[#FBBF24]/30 to-[#F59E0B]/30 rounded-3xl blur-md opacity-70 animate-pulse pointer-events-none" />

              <SpotlightCard
                spotlightColor="rgba(245, 158, 11, 0.25)"
                className="relative bg-[#121212] border-2 border-[#F59E0B] rounded-3xl p-7 sm:p-10 shadow-[0_0_50px_-10px_rgba(245,158,11,0.25)] transition-all"
              >
                {/* Top Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-black text-xs font-extrabold uppercase px-4 py-1 rounded-full shadow-lg z-30">
                  ACESSO COMPLETO
                </div>

                <div className="text-center pb-8 border-b border-[#222222]">
                  <span className="text-xs font-mono font-bold text-[#A1A1AA] tracking-widest uppercase">
                    PLANO ÚNICO & ILIMITADO
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    UMBRA DAILY OS PRO
                  </h3>

                  {/* Price Tag */}
                  <div className="mt-6 flex items-baseline justify-center gap-1.5">
                    <span className="text-2xl font-semibold text-[#D4D4D8]">R$</span>
                    <span className="text-6xl sm:text-7xl font-extrabold text-white font-mono tracking-tight tabular-nums drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                      9,90
                    </span>
                    <span className="text-[#A1A1AA] font-medium text-base">/ mês</span>
                  </div>

                  <p className="mt-2 text-xs font-mono text-[#F59E0B]">
                    Equivalente a menos de R$ 0,34 por dia
                  </p>
                </div>

                {/* Feature List */}
                <div className="py-8 space-y-3.5">
                  <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                    O que você recebe imediatamente:
                  </p>
                  {planFeatures.map((feat) => (
                    <div key={feat} className="flex items-start gap-3 text-sm text-[#D4D4D8]">
                      <div className="w-5 h-5 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button with Magnetic effect */}
                <div className="pt-4 border-t border-[#222222] space-y-4">
                  <MagneticButton
                    onClick={() => {
                      playClick();
                      onOpenCheckout();
                    }}
                    variant="primary"
                    className="w-full py-4 text-base font-extrabold text-black group"
                  >
                    <span>Quero começar agora</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </MagneticButton>

                  <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-[#A1A1AA]">
                      Assinatura mensal. Cancele quando quiser.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[11px] text-[#71717A]">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Pagamento 100% seguro via Pix ou Cartão de Crédito</span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
