import React, { useState } from 'react';
import { Calendar, Play, LineChart, CheckSquare2, Sparkles, ChevronRight } from 'lucide-react';
import { ScrollReveal } from './motion/ScrollReveal';
import { useSound } from '../hooks/useSound';

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { playTabSwitch, playHover } = useSound();

  const steps = [
    {
      num: '01',
      title: 'PLANEJAR',
      tagline: 'Defina sua missão principal e suas prioridades.',
      description: 'Gaste 3 minutos pela manhã. Escolha o único resultado que tornará o dia bem-sucedido e determine até 3 tarefas fundamentais de suporte.',
      detail: 'Você inicia o dia com um norte definido, blindado contra o hábito automático de abrir redes sociais antes de produzir algo de valor.',
      icon: Calendar,
    },
    {
      num: '02',
      title: 'EXECUTAR',
      tagline: 'Escolha uma tarefa e inicie seu Focus Timer.',
      description: 'Ligue o temporizador de 25 ou 50 minutos. Elimine todas as abas concorrentes e mergulhe em execução contínua monotarefa.',
      detail: 'Ao associar cada segundo a uma tarefa específica, seu cérebro entra em estado de flow e supera a fricção inicial do trabalho difícil.',
      icon: Play,
    },
    {
      num: '03',
      title: 'ACOMPANHAR',
      tagline: 'Visualize seu progresso e mantenha o ritmo.',
      description: 'Acompanhe em tempo real a barra de avanço diário. Conforme conclui as 3 prioridades, sua carga de estresse diminui progressivamente.',
      detail: 'Se surgir uma ideia durante o foco, aperte o atalho rápido do Cofre de Ideias e continue trabalhando sem interromper o raciocínio.',
      icon: LineChart,
    },
    {
      num: '04',
      title: 'REVISAR',
      tagline: 'Encerre o dia e prepare o próximo.',
      description: 'Ao final da jornada, faça uma revisão rápida de 2 minutos. Registre vitórias, arquive ideias e deixe as 3 prioridades de amanhã pré-definidas.',
      detail: 'Você dorme com a mente limpa e sem ansiedade, sabendo exatamente onde parou e por onde recomeçará no dia seguinte.',
      icon: CheckSquare2,
    },
  ];

  const handleSelectStep = (index: number) => {
    playTabSwitch();
    setActiveStep(index);
  };

  return (
    <section id="como-funciona" className="py-24 bg-[#0A0A0A] border-t border-[#1F1F1F] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#F59E0B] mb-3">
              O fluxo diário de execução
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Seu dia, organizado em 4 etapas.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#A1A1AA]">
              Uma rotina simples, disciplinada e sem fricção para você parar de planejar no vazio e começar a produzir resultados todos os dias.
            </p>
          </div>
        </ScrollReveal>

        {/* Steps Progress Navigator */}
        <div className="mt-16">
          {/* Horizontal connection line for desktop */}
          <div className="hidden lg:grid grid-cols-4 gap-4 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#222222] -translate-y-1/2 z-0" />
            
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isSelected = activeStep === index;
              return (
                <button
                  key={step.num}
                  onClick={() => handleSelectStep(index)}
                  onMouseEnter={() => playHover()}
                  className={`relative z-10 text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#151515] border-[#F59E0B] shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)] -translate-y-1'
                      : 'bg-[#101010] border-[#222222] hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-[#F59E0B]' : 'text-[#71717A]'}`}>
                      ETAPA {step.num}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#F59E0B] text-black font-bold shadow-md shadow-[#F59E0B]/20'
                          : 'bg-[#181818] text-[#A1A1AA] border border-[#262626]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                    {step.tagline}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Mobile vertical accordion */}
          <div className="lg:hidden space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isSelected = activeStep === index;
              return (
                <div
                  key={step.num}
                  onClick={() => handleSelectStep(index)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#151515] border-[#F59E0B]'
                      : 'bg-[#101010] border-[#222222]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-[#F59E0B] text-black font-bold' : 'bg-[#181818] text-[#A1A1AA]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-[#71717A]">ETAPA {step.num}</span>
                        <h3 className="text-base font-bold text-white">{step.title}</h3>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'rotate-90 text-[#F59E0B]' : 'text-[#71717A]'}`} />
                  </div>
                  {isSelected && (
                    <div className="mt-4 pt-3 border-t border-[#222222] text-xs text-[#A1A1AA] space-y-2 animate-fadeIn">
                      <p className="font-medium text-white">{step.tagline}</p>
                      <p>{step.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Showcase Card */}
          <ScrollReveal delay={150}>
            <div className="mt-8 bg-[#121212] border border-[#262626] hover:border-[#F59E0B]/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden transition-colors">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#F59E0B]">
                      FASE {steps[activeStep].num} DE 04
                    </span>
                    <span className="text-[#3F3F46]">·</span>
                    <span className="text-xs text-[#A1A1AA]">
                      {steps[activeStep].title}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {steps[activeStep].tagline}
                  </h3>
                  <p className="text-base text-[#D4D4D8] leading-relaxed">
                    {steps[activeStep].description}
                  </p>
                  <div className="p-4 bg-[#181818] border border-[#2A2A2A] rounded-xl text-xs sm:text-sm text-[#A1A1AA] flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Impacto neurocognitivo:</strong> {steps[activeStep].detail}
                    </span>
                  </div>
                </div>

                {/* Simulation KPI indicator for step */}
                <div className="bg-[#171717] border border-[#262626] rounded-xl p-5 space-y-3">
                  <span className="text-xs font-mono text-[#71717A]">MÉTRICA DE EXECUÇÃO</span>
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#A1A1AA]">Clareza mental</span>
                      <span className="text-emerald-400 font-mono font-semibold">+92%</span>
                    </div>
                    <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[92%] transition-all duration-700" />
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-[#A1A1AA]">Atrito de decisão</span>
                      <span className="text-[#F59E0B] font-mono font-semibold">-84%</span>
                    </div>
                    <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#F59E0B] h-full w-[84%] transition-all duration-700" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs">
                    <span className="text-[#71717A]">Tempo estimado na etapa</span>
                    <span className="text-white font-mono font-bold">2 a 5 minutos</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
