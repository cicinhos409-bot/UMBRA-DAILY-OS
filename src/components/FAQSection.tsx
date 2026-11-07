import React, { useState } from 'react';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { FAQ_DATA } from '../data/landingData';
import { ScrollReveal } from './motion/ScrollReveal';
import { useSound } from '../hooks/useSound';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const { playClick, playHover } = useSound();

  const toggle = (id: string) => {
    playClick();
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-24 bg-[#080808] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#F59E0B] mb-3">
              Tire suas dúvidas
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#A1A1AA]">
              Respostas claras e diretas sobre o funcionamento, valores e acesso à plataforma.
            </p>
          </div>
        </ScrollReveal>

        {/* Accordion List with ScrollReveal */}
        <div className="mt-14 space-y-3.5">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openId === item.id;
            return (
              <ScrollReveal key={item.id} delay={Math.min(index * 40, 280)}>
                <div
                  className={`bg-[#121212] border rounded-2xl transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'border-[#F59E0B]/50 bg-[#151515] shadow-[0_0_20px_-10px_rgba(245,158,11,0.2)]'
                      : 'border-[#222222] hover:border-[#383838]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    onMouseEnter={() => playHover()}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-xs font-mono text-[#71717A] shrink-0">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="text-base sm:text-lg font-bold text-white group-hover:text-[#FBBF24] transition-colors">
                        {item.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#A1A1AA] transition-transform duration-300 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#F59E0B]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-[#A1A1AA] leading-relaxed border-t border-[#1C1C1C] animate-fadeIn">
                      <p className="pl-7">{item.answer}</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Support helper */}
        <ScrollReveal delay={200}>
          <div className="mt-12 text-center p-6 bg-[#121212] border border-[#222222] rounded-2xl">
            <p className="text-sm text-white font-medium">Ainda tem alguma dúvida específica?</p>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Nosso suporte técnico responde diretamente em menos de 2 horas.
            </p>
            <a
              href="mailto:suporte@umbra-daily.os"
              onClick={() => playClick()}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-[#1C1C1C] hover:bg-[#252525] border border-[#333333] text-xs font-medium text-white transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Falar com o suporte</span>
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
