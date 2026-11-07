import React from 'react';
import { Target, Clock, Sparkles, Brain, Check } from 'lucide-react';
import { SpotlightCard } from './motion/SpotlightCard';
import { ScrollReveal } from './motion/ScrollReveal';
import { useSound } from '../hooks/useSound';

export const SolutionSection: React.FC = () => {
  const { playHover } = useSound();

  return (
    <section id="solucao" className="py-24 bg-[#080808] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#F59E0B]/5 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#F59E0B] mb-3">
              Arquitetura de alta performance
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Um sistema para transformar seus dias em execução.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#A1A1AA]">
              Do primeiro momento da manhã até o encerramento do dia, o UMBRA Daily OS organiza sua rotina e mantém você focado no que importa.
            </p>
          </div>
        </ScrollReveal>

        {/* Bento Grid: 4 Core Solution Pillars with Spotlight and 3D Tilt */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* CARD 1 — Daily Mission */}
          <ScrollReveal delay={0}>
            <SpotlightCard
              onMouseEnter={() => playHover()}
              className="p-6 sm:p-8 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-[#71717A]">PILAR 01</span>
                </div>

                <h3 className="text-2xl font-bold text-white group-hover:text-[#FBBF24] transition-colors">
                  Daily Mission
                </h3>
                <p className="text-sm font-medium text-[#F59E0B] mt-1">
                  Uma missão. Um objetivo. Um dia de execução.
                </p>
                <p className="mt-3 text-sm text-[#A1A1AA] leading-relaxed">
                  Elimine a paralisia de escolha. Toda manhã o sistema solicita a vitória principal do dia e até 3 prioridades de suporte. O resto aguarda.
                </p>
              </div>

              {/* Embedded interactive-looking UI component */}
              <div className="mt-6 bg-[#161616] border border-[#262626] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#222222]">
                  <span className="font-semibold text-white">Missão Ativa</span>
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Em progresso (67%)
                  </span>
                </div>
                <div className="text-sm text-white font-medium bg-[#1F1F1F] p-2.5 rounded-lg border border-[#2C2C2C]">
                  Lançar o novo funil de conversão e validar métricas
                </div>
                <div className="space-y-1.5 text-xs text-[#A1A1AA]">
                  <div className="flex items-center justify-between">
                    <span>Prioridade 1: Escrever copy da página</span>
                    <span className="text-emerald-400 font-mono">Concluída</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Prioridade 2: Subir checkout e testar webhook</span>
                    <span className="text-[#F59E0B] font-mono">Próxima</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </ScrollReveal>

          {/* CARD 2 — Focus Mode */}
          <ScrollReveal delay={100}>
            <SpotlightCard
              onMouseEnter={() => playHover()}
              className="p-6 sm:p-8 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-[#71717A]">PILAR 02</span>
                </div>

                <h3 className="text-2xl font-bold text-white group-hover:text-[#FBBF24] transition-colors">
                  Focus Mode
                </h3>
                <p className="text-sm font-medium text-[#F59E0B] mt-1">
                  Pare de alternar entre tarefas. Entre em modo execução.
                </p>
                <p className="mt-3 text-sm text-[#A1A1AA] leading-relaxed">
                  Temporizadores de concentração calibrados para eliminar a tentação de abrir abas paralelas. Cada sessão é contabilizada no seu tempo líquido diário.
                </p>
              </div>

              {/* Embedded Focus Timer preview */}
              <div className="mt-6 bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#71717A] uppercase font-mono">Sessão em Andamento</span>
                  <div className="text-3xl font-mono font-bold text-white mt-1 tabular-nums drop-shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                    21:40
                  </div>
                  <span className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Sessão 3 de 4 planejadas
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-[#A1A1AA]">Tempo Líquido Hoje</div>
                  <div className="text-base font-bold font-mono text-white">1h 45m</div>
                  <div className="text-[11px] text-emerald-400 font-mono">+25% vs média</div>
                </div>
              </div>
            </SpotlightCard>
          </ScrollReveal>

          {/* CARD 3 — Idea Vault */}
          <ScrollReveal delay={150}>
            <SpotlightCard
              onMouseEnter={() => playHover()}
              className="p-6 sm:p-8 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-[#71717A]">PILAR 03</span>
                </div>

                <h3 className="text-2xl font-bold text-white group-hover:text-[#FBBF24] transition-colors">
                  Idea Vault
                </h3>
                <p className="text-sm font-medium text-[#F59E0B] mt-1">
                  Capture ideias sem interromper o trabalho.
                </p>
                <p className="mt-3 text-sm text-[#A1A1AA] leading-relaxed">
                  Quando uma ideia de produto, conteúdo ou negócio surgir no meio de uma tarefa, registre com um atalho rápido no cofre. Seu foco continua blindado.
                </p>
              </div>

              {/* Embedded Idea tags preview */}
              <div className="mt-6 bg-[#161616] border border-[#262626] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                  <span className="font-semibold text-white">Cofre de Ideias Recente</span>
                  <span className="text-[#71717A] font-mono">14 ideias salvas</span>
                </div>
                <div className="p-2.5 bg-[#1C1C1C] rounded-lg border border-[#2A2A2A] text-xs">
                  <p className="text-white font-medium">Gravar tutorial de 60s sobre o método de 3 prioridades</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#A1A1AA]">
                    <span className="text-[#F59E0B]">#Conteúdo</span>
                    <span>·</span>
                    <span>Prioridade: Alta</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </ScrollReveal>

          {/* CARD 4 — Daily AI */}
          <ScrollReveal delay={200}>
            <SpotlightCard
              onMouseEnter={() => playHover()}
              className="p-6 sm:p-8 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                    <Brain className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-[#71717A]">PILAR 04</span>
                </div>

                <h3 className="text-2xl font-bold text-white group-hover:text-[#FBBF24] transition-colors">
                  Daily AI
                </h3>
                <p className="text-sm font-medium text-[#F59E0B] mt-1">
                  Descubra sua próxima ação.
                </p>
                <p className="mt-3 text-sm text-[#A1A1AA] leading-relaxed">
                  Sentindo-se sobrecarregado ou sem clareza? A inteligência do Daily OS analisa seus projetos e entrega uma micro-ação de 5 minutos para vencer a inércia.
                </p>
              </div>

              {/* Embedded AI Prompt Box */}
              <div className="mt-6 bg-[#161616] border border-[#262626] rounded-xl p-4 space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="text-[#71717A] shrink-0 font-mono">Você:</span>
                  <span className="text-[#D4D4D8]">"Tenho 2 horas livres agora à tarde. O que devo fazer?"</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs bg-[#1D1B14] border border-[#F59E0B]/20 p-2.5 rounded-lg">
                  <span className="text-[#F59E0B] shrink-0 font-bold font-mono">IA:</span>
                  <span className="text-white">
                    "Execute o bloco de 50 minutos na documentação da API. Isso desbloqueará a equipe amanhã cedo."
                  </span>
                </div>
              </div>
            </SpotlightCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
