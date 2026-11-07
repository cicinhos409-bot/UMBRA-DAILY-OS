import React from 'react';
import { ArrowRight, Sparkles, Check, ChevronUp } from 'lucide-react';
import { MagneticButton } from './motion/MagneticButton';
import { ScrollReveal } from './motion/ScrollReveal';
import { useSound } from '../hooks/useSound';

interface FinalCTAProps {
  onOpenCheckout: () => void;
  onExploreClick: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenCheckout, onExploreClick }) => {
  const { playClick } = useSound();

  return (
    <section className="py-24 bg-[#0A0A0A] border-t border-[#1F1F1F] relative overflow-hidden">
      {/* Intense amber glow backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-[#F59E0B]/12 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#F59E0B] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comece amanhã cedo no controle</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            Seu próximo dia pode ser diferente.
          </h2>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xl sm:text-2xl font-bold">
            <span className="text-[#A1A1AA]">Menos distração.</span>
            <span className="text-[#D4D4D8]">Mais clareza.</span>
            <span className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] bg-clip-text text-transparent">
              Mais execução.
            </span>
          </div>

          <p className="mt-3 text-sm text-[#71717A] max-w-md mx-auto">
            Por menos de R$ 0,34 ao dia, você troca a sobrecarga mental por um plano de ação diário inegociável.
          </p>
        </ScrollReveal>

        {/* CTA Buttons with Magnetic effect */}
        <ScrollReveal delay={150}>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton
              onClick={() => {
                playClick();
                onOpenCheckout();
              }}
              variant="primary"
              className="w-full sm:w-auto px-8 py-4 text-base font-extrabold text-black group"
            >
              <span>Começar por R$ 9,90/mês</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>

            <MagneticButton
              onClick={() => {
                playClick();
                onExploreClick();
              }}
              variant="secondary"
              className="w-full sm:w-auto px-7 py-4 text-sm font-medium text-[#D4D4D8] group"
            >
              <span>Conhecer o sistema</span>
              <ChevronUp className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors" />
            </MagneticButton>
          </div>
        </ScrollReveal>

        {/* Mini Trust Checklist below */}
        <ScrollReveal delay={250}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#A1A1AA]">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Ativação imediata
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Sem fidelidade contratual
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Cancele quando quiser
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
