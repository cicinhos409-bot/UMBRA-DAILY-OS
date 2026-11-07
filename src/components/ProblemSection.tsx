import React, { useState } from 'react';
import { Compass, Smartphone, SplitSquareVertical, Brain, ShieldAlert, XCircle, CheckCircle } from 'lucide-react';
import { SpotlightCard } from './motion/SpotlightCard';
import { ScrollReveal } from './motion/ScrollReveal';
import { useSound } from '../hooks/useSound';

export const ProblemSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'caos' | 'umbra'>('caos');
  const { playClick, playHover } = useSound();

  const problems = [
    {
      num: '01',
      title: 'Você acorda sem saber por onde começar.',
      description: 'A mente já desperta em alerta, sobrecarregada por dezenas de pendências soltas e nenhuma clareza da primeira ação.',
      icon: Compass,
    },
    {
      num: '02',
      title: 'Abre Telegram, redes sociais e várias plataformas.',
      description: 'Antes mesmo de produzir algo para si, seu dia é sequestrado pelas prioridades e demandas urgentes dos outros.',
      icon: Smartphone,
    },
    {
      num: '03',
      title: 'Começa uma tarefa e abandona no meio.',
      description: 'Qualquer notificação ou pensamento intrusivo faz você alternar abas, deixando um rastro de projetos incompletos.',
      icon: SplitSquareVertical,
    },
    {
      num: '04',
      title: 'Tem dezenas de ideias, mas pouca execução.',
      description: 'Ideias brilhantes anotadas em guardanapos, notas do celular e áudios que nunca se tornam planos práticos.',
      icon: Brain,
    },
    {
      num: '05',
      title: 'Termina o dia sem saber o que realmente avançou.',
      description: 'Cansaço extremo e a dolorosa sensação de que trabalhou 10 horas sem mover os projetos mais importantes.',
      icon: ShieldAlert,
    },
  ];

  return (
    <section className="py-24 bg-[#0A0A0A] border-t border-[#1F1F1F] relative overflow-hidden">
      {/* Background soft ambient */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-red-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F59E0B]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-wider uppercase text-amber-500 mb-3">
              O ciclo da sobrecarga mental
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Seu dia começa assim?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#A1A1AA]">
              A maioria das pessoas falha não por falta de capacidade ou esforço, mas porque tenta gerenciar o dia inteiro confiando na memória e no improviso.
            </p>
          </div>
        </ScrollReveal>

        {/* 5 Problem Cards with Spotlight & 3D Tilt */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.num} delay={idx * 75}>
                <SpotlightCard
                  onMouseEnter={() => playHover()}
                  className={`p-6 flex flex-col justify-between h-full ${
                    idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-semibold text-[#71717A] group-hover:text-[#F59E0B] transition-colors">
                        {item.num}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-[#A1A1AA] group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#FBBF24] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-[#A1A1AA] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </SpotlightCard>
              </ScrollReveal>
            );
          })}

          {/* 6th Card: Callout contrast */}
          <ScrollReveal delay={350}>
            <SpotlightCard
              spotlightColor="rgba(245, 158, 11, 0.2)"
              className="p-6 flex flex-col justify-center h-full border-[#F59E0B]/30"
            >
              <span className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider mb-2">
                A virada de chave
              </span>
              <h3 className="text-xl font-bold text-white">
                Você não precisa carregar tudo na cabeça.
              </h3>
              <p className="mt-2 text-sm text-[#A1A1AA]">
                O cérebro humano foi feito para gerar ideias e resolver problemas — não para atuar como um arquivo de pendências.
              </p>
            </SpotlightCard>
          </ScrollReveal>
        </div>

        {/* Visual Comparison: Caos vs Clareza UMBRA */}
        <ScrollReveal delay={200}>
          <div className="mt-16 bg-[#111111] border border-[#262626] rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Contraste de Realidade: Duas formas de viver o mesmo dia
                </h3>
                <p className="text-sm text-[#A1A1AA]">
                  Compare o estado mental típico com a experiência proporcionada pelo UMBRA Daily OS.
                </p>
              </div>

              {/* Interactive Toggle */}
              <div className="flex items-center gap-1 p-1 bg-[#1A1A1A] rounded-xl border border-[#2D2D2D] shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => {
                    playClick();
                    setActiveTab('caos');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'caos'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  Rotina Caótica
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setActiveTab('umbra');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'umbra'
                      ? 'bg-[#F59E0B] text-black font-bold'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  Com UMBRA OS
                </button>
              </div>
            </div>

            {activeTab === 'caos' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 animate-fadeIn">
                <div className="bg-[#161616] border border-red-950/40 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-2">
                    <XCircle className="w-4 h-4" />
                    <span>DISPERSÃO COGNITIVA</span>
                  </div>
                  <p className="text-sm text-[#D4D4D8]">
                    Mais de 25 abas abertas no navegador, celular vibrando a cada minuto e sensação constante de estar atrasado.
                  </p>
                </div>

                <div className="bg-[#161616] border border-red-950/40 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-2">
                    <XCircle className="w-4 h-4" />
                    <span>PARALISIA POR ANÁLISE</span>
                  </div>
                  <p className="text-sm text-[#D4D4D8]">
                    Gasta 40 minutos planejando listas infinitas no Notion ou bloco de notas sem executar nenhuma linha sequer.
                  </p>
                </div>

                <div className="bg-[#161616] border border-red-950/40 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-2">
                    <XCircle className="w-4 h-4" />
                    <span>CULPA AO DEITAR</span>
                  </div>
                  <p className="text-sm text-[#D4D4D8]">
                    Sensação de peso ao dormir pensando: "O que eu fiz hoje com o meu tempo? Amanhã precisarei correr em dobro."
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 animate-fadeIn">
                <div className="bg-[#161616] border border-[#F59E0B]/30 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-[#F59E0B] text-xs font-semibold mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>1 MISSÃO & 3 PRIORIDADES</span>
                  </div>
                  <p className="text-sm text-[#D4D4D8]">
                    Você acorda sabendo exatamente qual vitória precisa conquistar. Tarefas secundárias ficam bloqueadas até o essencial estar pronto.
                  </p>
                </div>

                <div className="bg-[#161616] border border-[#F59E0B]/30 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-[#F59E0B] text-xs font-semibold mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>SESSÕES DE FOCO LÍQUIDO</span>
                  </div>
                  <p className="text-sm text-[#D4D4D8]">
                    O Focus Timer protege blocos ininterruptos de 25 ou 50 minutos. Ideias repentinas vão direto para o Cofre de Ideias.
                  </p>
                </div>

                <div className="bg-[#161616] border border-[#F59E0B]/30 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-[#F59E0B] text-xs font-semibold mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>DEVER CUMPRIDO À NOITE</span>
                  </div>
                  <p className="text-sm text-[#D4D4D8]">
                    Fechamento diário de 2 minutos para registrar vitórias reais e preparar o dia seguinte com tranquilidade e paz de espírito.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
