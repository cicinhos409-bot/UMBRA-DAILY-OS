import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Timer,
  FolderKanban,
  Sparkles,
  Cpu,
  Play,
  Pause,
  RotateCcw,
  Check,
  Plus,
  Send,
  Target,
  Flame,
  ArrowRight
} from 'lucide-react';
import { INITIAL_TASKS, INITIAL_PROJECTS, INITIAL_IDEAS, AI_INTERACTIONS_DEMO } from '../data/landingData';
import { DailyTask, IdeaItem } from '../types';
import { ScrollReveal } from './motion/ScrollReveal';
import { MagneticButton } from './motion/MagneticButton';
import { useSound } from '../hooks/useSound';

interface ProductDemoProps {
  onOpenCheckout: () => void;
}

export const ProductDemo: React.FC<ProductDemoProps> = ({ onOpenCheckout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'focus' | 'projects' | 'vault' | 'ai'>('dashboard');
  const { playClick, playHover, playTabSwitch, playTaskComplete, playTimerChime } = useSound();

  // Dashboard tasks state
  const [tasks, setTasks] = useState<DailyTask[]>(INITIAL_TASKS);
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
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedTasksCount / tasks.length) * 100);

  // Focus Timer state
  const [focusDuration, setFocusDuration] = useState<number>(25 * 60);
  const [focusSeconds, setFocusSeconds] = useState<number>(25 * 60);
  const [focusRunning, setFocusRunning] = useState<boolean>(false);
  const [focusSessionsCompleted, setFocusSessionsCompleted] = useState<number>(2);

  useEffect(() => {
    let interval: any = null;
    if (focusRunning && focusSeconds > 0) {
      interval = setInterval(() => {
        setFocusSeconds((prev) => prev - 1);
      }, 1000);
    } else if (focusSeconds === 0) {
      setFocusRunning(false);
      setFocusSessionsCompleted((prev) => prev + 1);
      playTimerChime();
    }
    return () => clearInterval(interval);
  }, [focusRunning, focusSeconds]);

  const switchFocusMode = (minutes: number) => {
    playClick();
    setFocusRunning(false);
    setFocusDuration(minutes * 60);
    setFocusSeconds(minutes * 60);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Projects filter state
  const [projectFilter, setProjectFilter] = useState<string>('todos');
  const filteredProjects = INITIAL_PROJECTS.filter((p) => {
    if (projectFilter === 'todos') return true;
    return p.category.toLowerCase().includes(projectFilter.toLowerCase());
  });

  // Ideas state
  const [ideas, setIdeas] = useState<IdeaItem[]>(INITIAL_IDEAS);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [showAddIdea, setShowAddIdea] = useState(false);

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;
    const newIdea: IdeaItem = {
      id: `i-${Date.now()}`,
      title: newIdeaTitle,
      content: 'Captura rápida pelo atalho de produtividade.',
      category: 'Produto',
      date: 'Agora mesmo',
      priority: 'Prioritária',
      tags: ['Ideia Rápida', 'Foco'],
    };
    setIdeas([newIdea, ...ideas]);
    setNewIdeaTitle('');
    setShowAddIdea(false);
    playTaskComplete();
  };

  // AI Chat state
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; action?: string }>>([
    {
      sender: 'user',
      text: 'Não sei o que fazer agora.',
    },
    {
      sender: 'ai',
      text: 'Sua prioridade máxima é finalizar o endpoint de sincronização no projeto API v2. Vamos começar com uma ação de 5 minutos: abra o código e liste os 3 parâmetros essenciais.',
      action: 'Iniciar bloco de 5 minutos',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const sendAiMessage = (userText: string) => {
    if (!userText.trim()) return;
    playClick();
    const matched = AI_INTERACTIONS_DEMO.find(
      (item) => item.question.toLowerCase() === userText.toLowerCase()
    );

    const aiReply = matched
      ? matched.answer
      : `Entendido. Para avançar com mais clareza, pause distrações e foque na tarefa "${tasks.find((t) => !t.completed)?.title || 'Revisão da rotina'}". O segredo é dar o primeiro passo de 5 minutos.`;

    const newAction = matched ? matched.microAction : 'Ativar Focus Timer agora';

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText },
      { sender: 'ai', text: aiReply, action: newAction },
    ]);
    setInputMessage('');
  };

  const handleTabChange = (tab: 'dashboard' | 'focus' | 'projects' | 'vault' | 'ai') => {
    playTabSwitch();
    setActiveTab(tab);
  };

  return (
    <section id="demonstracao" className="py-24 bg-[#080808] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#F59E0B] mb-3">
              Interface Real em Ação
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Veja como seu dia pode funcionar.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#A1A1AA]">
              Teste as abas interativas abaixo para experimentar a clareza, a velocidade e o foco do UMBRA Daily OS.
            </p>
          </div>
        </ScrollReveal>

        {/* Demo Window Container with Motion */}
        <ScrollReveal delay={150}>
          <div className="mt-14 max-w-5xl mx-auto bg-[#101010] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden hover:border-[#F59E0B]/30 transition-colors">
            {/* Window Top Controls & Tabs Bar */}
            <div className="bg-[#0C0C0C] border-b border-[#222222] p-3 sm:px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Window dots */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#262626]" />
                <span className="w-3 h-3 rounded-full bg-[#262626]" />
                <span className="w-3 h-3 rounded-full bg-[#262626]" />
                <span className="text-xs font-mono text-[#71717A] ml-2">app.umbra.os</span>
              </div>

              {/* Interactive Tab Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                <button
                  onClick={() => handleTabChange('dashboard')}
                  onMouseEnter={() => playHover()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-[#1F1F1F] text-[#F59E0B] border border-[#333333] shadow-sm'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#151515]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => handleTabChange('focus')}
                  onMouseEnter={() => playHover()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'focus'
                      ? 'bg-[#1F1F1F] text-[#F59E0B] border border-[#333333] shadow-sm'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#151515]'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>Focus Mode</span>
                </button>

                <button
                  onClick={() => handleTabChange('projects')}
                  onMouseEnter={() => playHover()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'projects'
                      ? 'bg-[#1F1F1F] text-[#F59E0B] border border-[#333333] shadow-sm'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#151515]'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Projetos</span>
                </button>

                <button
                  onClick={() => handleTabChange('vault')}
                  onMouseEnter={() => playHover()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'vault'
                      ? 'bg-[#1F1F1F] text-[#F59E0B] border border-[#333333] shadow-sm'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#151515]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cofre de Ideias</span>
                </button>

                <button
                  onClick={() => handleTabChange('ai')}
                  onMouseEnter={() => playHover()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'ai'
                      ? 'bg-[#1F1F1F] text-[#F59E0B] border border-[#333333] shadow-sm'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#151515]'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Daily AI</span>
                </button>
              </div>

              {/* Version pill */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#71717A]">Versão 2.0 Motion</span>
              </div>
            </div>

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="p-5 sm:p-8 space-y-6 animate-fadeIn">
                {/* Daily Mission Header */}
                <div className="bg-[#151515] border border-[#262626] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B] mb-1">
                      <Target className="w-4 h-4" />
                      <span>MISSÃO PRINCIPAL DO DIA</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Finalizar arquitetura da API v2 e sincronizar fluxo de lançamento
                    </h3>
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      Meta de esforço: 4 horas de foco líquido divididas em 4 blocos.
                    </p>
                  </div>

                  <div className="bg-[#1C1C1C] border border-[#2A2A2A] px-4 py-2.5 rounded-xl shrink-0">
                    <div className="text-xs text-[#71717A]">Progresso do Dia</div>
                    <div className="text-lg font-bold font-mono text-white tabular-nums">
                      {progressPercent}% <span className="text-xs text-[#A1A1AA] font-normal">({completedTasksCount}/{tasks.length})</span>
                    </div>
                  </div>
                </div>

                {/* 3 Priorities + Active Tasks List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#A1A1AA] px-1">
                    <span className="font-semibold text-white uppercase tracking-wider">
                      Suas 3 Prioridades & Tarefas (Clique para alternar)
                    </span>
                    <span>Clique para marcar conclusão</span>
                  </div>

                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                          task.completed
                            ? 'bg-[#121212] border-[#222222] opacity-70'
                            : 'bg-[#161616] border-[#282828] hover:border-[#F59E0B]/40 hover:bg-[#1A1A1A]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              task.completed
                                ? 'bg-emerald-500 text-black'
                                : 'border border-[#3F3F46] group-hover:border-[#F59E0B]'
                            }`}
                          >
                            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                task.completed ? 'line-through text-[#71717A]' : 'text-white'
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="text-[11px] text-[#71717A]">
                              {task.category} · Duração estimada: {task.duration}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              task.completed
                                ? 'bg-emerald-950/40 text-emerald-400'
                                : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                            }`}
                          >
                            {task.completed ? 'CONCLUÍDO' : 'PENDENTE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FOCUS MODE */}
            {activeTab === 'focus' && (
              <div className="p-6 sm:p-10 space-y-8 animate-fadeIn text-center max-w-2xl mx-auto">
                <div>
                  <span className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider flex items-center justify-center gap-1.5 mb-2">
                    <Flame className="w-4 h-4" /> MODO CONCENTRAÇÃO TOTAL
                  </span>
                  <h3 className="text-2xl font-bold text-white">
                    Tarefa Atual: Finalizar endpoint de sincronização
                  </h3>
                  <p className="text-sm text-[#A1A1AA] mt-1">
                    Sem notificações. Sem alternar janelas. Apenas 1 foco.
                  </p>
                </div>

                {/* Preset mode switcher */}
                <div className="inline-flex items-center p-1 bg-[#161616] border border-[#262626] rounded-xl gap-1">
                  <button
                    onClick={() => switchFocusMode(25)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      focusDuration === 25 * 60 ? 'bg-[#F59E0B] text-black font-bold' : 'text-[#A1A1AA]'
                    }`}
                  >
                    Pomodoro 25m
                  </button>
                  <button
                    onClick={() => switchFocusMode(50)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      focusDuration === 50 * 60 ? 'bg-[#F59E0B] text-black font-bold' : 'text-[#A1A1AA]'
                    }`}
                  >
                    Deep Work 50m
                  </button>
                  <button
                    onClick={() => switchFocusMode(5)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      focusDuration === 5 * 60 ? 'bg-[#F59E0B] text-black font-bold' : 'text-[#A1A1AA]'
                    }`}
                  >
                    Pausa Rápida 5m
                  </button>
                </div>

                {/* Huge Timer */}
                <div className="py-4">
                  <div className="text-6xl sm:text-7xl font-mono font-bold text-white tracking-widest tabular-nums drop-shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                    {formatTimer(focusSeconds)}
                  </div>
                  <p className="text-xs font-mono text-[#A1A1AA] mt-3">
                    Sessões de foco completadas hoje:{' '}
                    <span className="text-[#F59E0B] font-bold">{focusSessionsCompleted}</span> / 6
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      playClick();
                      if (!focusRunning) playTimerChime();
                      setFocusRunning(!focusRunning);
                    }}
                    className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg cursor-pointer ${
                      focusRunning
                        ? 'bg-[#262626] text-white hover:bg-[#333333]'
                        : 'bg-[#F59E0B] text-black hover:bg-[#FBBF24] shadow-[#F59E0B]/20'
                    }`}
                  >
                    {focusRunning ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>Pausar Sessão</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Iniciar Foco</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      playClick();
                      setFocusRunning(false);
                      setFocusSeconds(focusDuration);
                    }}
                    className="p-3.5 rounded-xl border border-[#262626] text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                    title="Reiniciar timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="p-5 sm:p-8 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Projetos Ativos em Andamento
                    </h3>
                    <p className="text-xs text-[#A1A1AA]">
                      Conecte metas de alto nível às suas tarefas diárias de execução.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#71717A]">Filtrar:</span>
                    <div className="flex items-center gap-1 bg-[#151515] p-1 rounded-lg border border-[#262626] text-xs">
                      <button
                        onClick={() => {
                          playClick();
                          setProjectFilter('todos');
                        }}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          projectFilter === 'todos' ? 'bg-[#262626] text-white font-medium' : 'text-[#71717A]'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => {
                          playClick();
                          setProjectFilter('produto');
                        }}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          projectFilter === 'produto' ? 'bg-[#262626] text-white font-medium' : 'text-[#71717A]'
                        }`}
                      >
                        Produto
                      </button>
                      <button
                        onClick={() => {
                          playClick();
                          setProjectFilter('marketing');
                        }}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          projectFilter === 'marketing' ? 'bg-[#262626] text-white font-medium' : 'text-[#71717A]'
                        }`}
                      >
                        Marketing
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-[#151515] border border-[#262626] hover:border-[#383838] p-5 rounded-xl space-y-4 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono text-[#F59E0B] uppercase">
                            {project.category}
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            {project.title}
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-[#71717A] bg-[#1E1E1E] px-2 py-0.5 rounded">
                          {project.dueDate}
                        </span>
                      </div>

                      <p className="text-xs text-[#A1A1AA] leading-relaxed">
                        {project.description}
                      </p>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[#71717A]">
                            Tarefas: {project.completedTasks}/{project.totalTasks}
                          </span>
                          <span className="font-mono font-bold text-white tabular-nums">
                            {project.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-[#262626] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] h-full rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: IDEA VAULT */}
            {activeTab === 'vault' && (
              <div className="p-5 sm:p-8 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Cofre de Ideias (Idea Vault)
                    </h3>
                    <p className="text-xs text-[#A1A1AA]">
                      Capture insights instantaneamente sem interromper sua tarefa de foco.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      playClick();
                      setShowAddIdea(!showAddIdea);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-black bg-[#F59E0B] hover:bg-[#FBBF24] rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Ideia</span>
                  </button>
                </div>

                {/* Quick Add Idea Form inside Demo */}
                {showAddIdea && (
                  <form
                    onSubmit={handleAddIdea}
                    className="bg-[#181818] border border-[#F59E0B]/30 p-4 rounded-xl flex gap-3 animate-fadeIn"
                  >
                    <input
                      type="text"
                      value={newIdeaTitle}
                      onChange={(e) => setNewIdeaTitle(e.target.value)}
                      placeholder="Descreva a ideia em poucas palavras..."
                      className="flex-1 bg-[#121212] border border-[#262626] px-3.5 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-[#F59E0B]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#F59E0B] text-black font-bold text-xs rounded-lg hover:bg-[#FBBF24] cursor-pointer"
                    >
                      Salvar no Cofre
                    </button>
                  </form>
                )}

                {/* Ideas Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ideas.map((idea) => (
                    <div
                      key={idea.id}
                      className="bg-[#151515] border border-[#262626] hover:border-[#383838] p-4 rounded-xl space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#F59E0B] font-mono font-medium">
                          #{idea.category}
                        </span>
                        <span className="text-[11px] text-[#71717A]">{idea.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{idea.title}</h4>
                      <p className="text-xs text-[#A1A1AA]">{idea.content}</p>
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#222222]">
                        {idea.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F1F1F] text-[#A1A1AA]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: DAILY AI */}
            {activeTab === 'ai' && (
              <div className="p-5 sm:p-8 space-y-6 animate-fadeIn">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B] mb-1">
                    <Cpu className="w-4 h-4" />
                    <span>COPILOTO DE EXECUÇÃO DIÁRIA</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Converse com seu estrategista de produtividade
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">
                    Em vez de conselhos genéricos, receba planos de ação de 5 minutos desenhados para romper a inércia.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-[#71717A] py-1">Experimente perguntar:</span>
                  {AI_INTERACTIONS_DEMO.map((item) => (
                    <button
                      key={item.question}
                      onClick={() => sendAiMessage(item.question)}
                      onMouseEnter={() => playHover()}
                      className="px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2A2A2A] hover:border-[#F59E0B]/50 text-[#D4D4D8] hover:text-white transition-colors cursor-pointer text-left"
                    >
                      "{item.question}"
                    </button>
                  ))}
                </div>

                {/* Chat Thread */}
                <div className="bg-[#0E0E0E] border border-[#222222] rounded-xl p-4 max-h-[300px] overflow-y-auto space-y-3">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#222222] text-white'
                            : 'bg-[#181818] border border-[#2D2D2D] text-[#E4E4E7]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 font-mono text-[10px] text-[#71717A]">
                          {msg.sender === 'user' ? (
                            <span>Você</span>
                          ) : (
                            <span className="text-[#F59E0B] font-bold">Daily AI Copilot</span>
                          )}
                        </div>
                        <p>{msg.text}</p>
                        {msg.action && (
                          <div className="mt-2.5 pt-2 border-t border-[#262626] flex items-center justify-between">
                            <span className="text-[11px] text-[#F59E0B] font-semibold">
                              Ação imediata: {msg.action}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#F59E0B]" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendAiMessage(inputMessage)}
                    placeholder="Ex: Como divido um projeto grande em micro-ações hoje?..."
                    className="flex-1 bg-[#141414] border border-[#262626] px-4 py-2.5 text-xs text-white rounded-xl focus:outline-none focus:border-[#F59E0B]"
                  />
                  <button
                    onClick={() => sendAiMessage(inputMessage)}
                    className="px-4 py-2.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Bar within Demo with CTA */}
            <div className="bg-[#0C0C0C] border-t border-[#222222] p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#A1A1AA] text-center sm:text-left">
                Gostou da experiência? Desbloqueie todo o sistema agora por apenas{' '}
                <strong className="text-white">R$ 9,90/mês</strong>.
              </span>
              <MagneticButton
                onClick={() => {
                  playClick();
                  onOpenCheckout();
                }}
                variant="primary"
                className="px-4 py-2 text-xs font-bold text-black"
              >
                <span>Assinar UMBRA Daily OS</span>
              </MagneticButton>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
