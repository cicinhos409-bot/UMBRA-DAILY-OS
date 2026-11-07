import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Play, Pause, Target, Flame, Clock, Check, ChevronRight, Sparkles } from 'lucide-react';
import { INITIAL_TASKS } from '../data/landingData';
import { DailyTask } from '../types';
import { TextReveal } from './motion/TextReveal';
import { MagneticButton } from './motion/MagneticButton';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSound } from '../hooks/useSound';

interface HeroProps {
  onOpenCheckout: () => void;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenCheckout, onExploreClick }) => {
  const [tasks, setTasks] = useState<DailyTask[]>(INITIAL_TASKS.slice(0, 3));
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });
  const heroContainerRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { playClick, playTaskComplete, playTimerChime } = useSound();

  // Mouse Parallax for Desktop Mockup
  useEffect(() => {
    if (reducedMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const moveX = (e.clientX - centerX) / (centerX * 1.5);
      const moveY = (e.clientY - centerY) / (centerY * 1.5);
      setMouseParallax({ x: moveX * 8, y: moveY * 8 });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reducedMotion]);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setTimerRunning(false);
      playTimerChime();
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = !t.completed;
          if (next) playTaskComplete();
          else playClick();
          return { ...t, completed: next };
        }
        return t;
      })
    );
  };

  const handleTimerToggle = () => {
    playClick();
    if (!timerRunning) playTimerChime();
    setTimerRunning(!timerRunning);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section
      ref={heroContainerRef}
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden"
    >
      {/* Background ambient lighting with parallax */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-[#F59E0B]/10 blur-[140px] rounded-full pointer-events-none -z-10 transition-transform duration-700 ease-out"
        style={{
          transform: !reducedMotion
            ? `translate(calc(-50% + ${mouseParallax.x * -1.5}px), calc(-50% + ${mouseParallax.y * -1.5}px))`
            : undefined,
        }}
      />
      <div className="absolute top-1/3 left-1/4 w-[380px] h-[380px] bg-amber-600/5 blur-[110px] rounded-full pointer-events-none -z-10" />

      {/* Background subtle technical grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Top Copy */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Micro kicker */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#F59E0B] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_10px_#F59E0B] animate-pulse" />
            <span>Sistema Operacional de Execução Diária</span>
            <span className="text-[#71717A]">·</span>
            <span className="text-[#A1A1AA] font-normal">Apenas R$ 9,90/mês</span>
          </div>

          {/* Animated Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            <TextReveal
              text="Você não precisa de mais tempo. Precisa saber o que fazer com ele."
              highlightWords={['saber', 'o', 'que', 'fazer', 'com', 'ele.']}
            />
          </h1>

          {/* Subheadline with fade in */}
          <p
            className="mt-6 text-lg sm:text-xl text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed"
            style={{
              animation: 'textBlurFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both',
            }}
          >
            O UMBRA Daily OS transforma seus projetos, ideias e tarefas em um plano diário de execução.
            Organize sua rotina, descubra sua próxima prioridade e comece a fazer o que realmente importa.
          </p>

          {/* CTA Button Group with Magnetic effect */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton
              onClick={onOpenCheckout}
              variant="primary"
              className="w-full sm:w-auto px-8 py-4 text-base font-extrabold text-black group"
            >
              <span>Começar por R$ 9,90/mês</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>

            <MagneticButton
              onClick={onExploreClick}
              variant="secondary"
              className="w-full sm:w-auto px-7 py-4 text-base font-medium text-[#D4D4D8] group"
            >
              <span>Conhecer a plataforma</span>
              <ChevronRight className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors" />
            </MagneticButton>
          </div>

          {/* Value line below buttons */}
          <p className="mt-4 text-xs sm:text-sm text-[#71717A]">
            Organize sua rotina. Execute suas prioridades. Evolua todos os dias.
          </p>

          {/* Pillar metadata with dot separators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-[#A1A1AA]">
            <span className="hover:text-white transition-colors cursor-default">Planejamento diário</span>
            <span className="text-[#3f3f46]">·</span>
            <span className="hover:text-white transition-colors cursor-default">Focus Timer</span>
            <span className="text-[#3f3f46]">·</span>
            <span className="hover:text-white transition-colors cursor-default">Gestão de projetos</span>
            <span className="text-[#3f3f46]">·</span>
            <span className="hover:text-white transition-colors cursor-default">Inteligência artificial</span>
          </div>
        </div>

        {/* Hero Interactive Realistic Dashboard Mockup with 3D Parallax Tilt */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          {/* Subtle outer glow frame */}
          <div className="absolute -inset-1 bg-gradient-to-b from-[#F59E0B]/20 via-[#262626]/40 to-transparent rounded-2xl blur-xl -z-10 opacity-70" />

          {/* Floating badge 1: Left */}
          <div className="hidden lg:flex absolute -left-12 top-16 z-20 items-center gap-3 bg-[#151515]/95 backdrop-blur-md border border-[#262626] hover:border-[#F59E0B]/40 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 animate-float">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Missão Concluída</p>
              <p className="text-[11px] text-[#A1A1AA]">100% de foco matinal</p>
            </div>
          </div>

          {/* Floating badge 2: Right Top */}
          <div className="hidden lg:flex absolute -right-12 top-24 z-20 items-center gap-3 bg-[#151515]/95 backdrop-blur-md border border-[#262626] hover:border-[#F59E0B]/40 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 animate-float-delayed">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">45 min de Foco</p>
              <p className="text-[11px] text-[#A1A1AA]">Zona profunda ativada</p>
            </div>
          </div>

          {/* Floating badge 3: Right Bottom */}
          <div className="hidden lg:flex absolute -right-8 bottom-12 z-20 items-center gap-3 bg-[#151515]/95 backdrop-blur-md border border-[#262626] hover:border-[#F59E0B]/40 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 animate-float">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">3 Prioridades Definidas</p>
              <p className="text-[11px] text-[#A1A1AA]">Sem ruído ou dispersão</p>
            </div>
          </div>

          {/* Main Desktop Window Mockup with Mouse Parallax */}
          <div
            style={{
              transform: !reducedMotion
                ? `perspective(1200px) rotateX(${mouseParallax.y * -0.5}deg) rotateY(${mouseParallax.x * 0.5}deg)`
                : undefined,
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="bg-[#101010] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden hover:border-[#F59E0B]/30 transition-colors"
          >
            {/* Window Topbar */}
            <div className="bg-[#0C0C0C] border-b border-[#262626] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#262626] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#262626] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#262626] inline-block" />
                <span className="text-xs font-mono text-[#71717A] ml-2 hidden sm:inline-block">
                  umbra.os / dashboard / live
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#A1A1AA]">
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Modo Execução Ativo
                </span>
              </div>
            </div>

            {/* Dashboard Inner Canvas */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Header Greeting & Progress Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1F1F1F]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#F59E0B]">HOJE</span>
                    <span className="text-[#3F3F46]">·</span>
                    <span className="text-xs text-[#71717A]">Terça-feira, 07 de Novembro</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    Bom dia, Alex. Qual é a sua missão?
                  </h3>
                </div>

                {/* Live Progress Indicator */}
                <div className="flex items-center gap-4 bg-[#151515] px-4 py-2.5 rounded-xl border border-[#262626] self-start sm:self-auto">
                  <div className="text-right">
                    <p className="text-xs text-[#71717A]">Progresso Diário</p>
                    <p className="text-base font-bold font-mono text-white tabular-nums">
                      {progressPercent}%
                    </p>
                  </div>
                  <div className="w-20 bg-[#262626] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Grid: Main Mission (Left) & Focus Timer (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Main Mission & 3 Priorities */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Daily Mission Banner */}
                  <div className="bg-[#151515] border border-[#262626] hover:border-[#F59E0B]/40 p-4 sm:p-5 rounded-xl relative overflow-hidden group transition-all">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-[#F59E0B]/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#F59E0B] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        MISSÃO PRINCIPAL DO DIA
                      </span>
                      <span className="text-[11px] text-[#71717A] font-mono">1 de 1</span>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-white">
                      Finalizar o fluxo de lançamento e sincronizar tarefas prioritárias
                    </p>
                  </div>

                  {/* 3 Priorities Checklist (Interactive with sound!) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[#A1A1AA] px-1">
                      <span className="font-semibold text-white">3 PRIORIDADES DE EXECUÇÃO</span>
                      <span>{completedCount} de {tasks.length} concluídas</span>
                    </div>

                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          task.completed
                            ? 'bg-[#121212] border-[#222222] opacity-75'
                            : 'bg-[#151515] border-[#262626] hover:border-[#F59E0B]/40 hover:bg-[#181818]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              task.completed
                                ? 'bg-emerald-500 text-black'
                                : 'border border-[#3F3F46] group-hover:border-[#F59E0B] text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <span
                            className={`text-sm truncate ${
                              task.completed
                                ? 'line-through text-[#71717A]'
                                : 'text-[#E4E4E7] font-medium'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3 text-xs">
                          <span className="text-[#71717A] font-mono hidden sm:inline">
                            {task.duration}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              task.priority === 'alta'
                                ? 'text-[#F59E0B] bg-[#F59E0B]/10'
                                : 'text-[#A1A1AA] bg-[#262626]'
                            }`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Col: Focus Timer & Next Action */}
                <div className="space-y-4">
                  {/* Focus Timer Widget */}
                  <div className="bg-[#151515] border border-[#262626] hover:border-[#F59E0B]/40 p-5 rounded-xl text-center relative overflow-hidden flex flex-col justify-between h-full min-h-[220px] transition-all">
                    <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                        FOCUS TIMER
                      </span>
                      <span className="text-[11px] font-mono text-[#71717A]">Bloco 1/4</span>
                    </div>

                    <div className="my-3">
                      <div className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-wider tabular-nums drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        {formatTimer(secondsLeft)}
                      </div>
                      <p className="text-xs text-[#A1A1AA] mt-1">
                        {timerRunning ? 'Em concentração profunda' : 'Pronto para executar'}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleTimerToggle}
                        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          timerRunning
                            ? 'bg-[#262626] text-white hover:bg-[#333333]'
                            : 'bg-[#F59E0B] text-black hover:bg-[#FBBF24] shadow-md shadow-[#F59E0B]/20'
                        }`}
                      >
                        {timerRunning ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Iniciar Foco</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          playClick();
                          setTimerRunning(false);
                          setSecondsLeft(25 * 60);
                        }}
                        className="px-3 py-2.5 text-xs text-[#71717A] hover:text-white border border-[#262626] rounded-lg hover:bg-[#222222] transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Prompt / Next step banner */}
              <div className="bg-[#121212] border border-[#222222] px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                  <span className="text-[#A1A1AA]">
                    <strong className="text-white font-medium">Próxima Ação Sugerida pela IA:</strong> Finalizar endpoint de autenticação antes das 12:00.
                  </span>
                </div>
                <span className="text-[#71717A] font-mono">Tempo restante estimado: 35m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
