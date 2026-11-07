import React from 'react';
import {
  ArrowRight, ArrowUpRight, Check, CheckCircle2, Circle, Clock3, Focus,
  FolderKanban, Lightbulb, ListTodo, MoveDown, MoveUp, Pause, Play, Plus, Sparkles, Target,
  Trash2, TriangleAlert, WandSparkles,
} from 'lucide-react';
import type {
  ActiveFocusSession, DashboardProject, DashboardTask, DailyMission, FocusSession,
  ScheduleItem,
} from './types';
import type { DashboardModule } from './DashboardSidebar';

const cardClass = 'rounded-2xl border border-white/[0.08] bg-[#101010] p-5 sm:p-6';
const mutedText = 'text-[#A1A1AA]';

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder} min`;
}

interface MissionCardProps {
  mission: DailyMission | null;
  projectName?: string;
  onEdit: () => void;
  onComplete: () => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({ mission, projectName, onEdit, onComplete }) => (
  <section className={`${cardClass} relative overflow-hidden border-[#F59E0B]/20`}>
    <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-[#F59E0B]/[0.07] blur-[70px]" />
    <div className="relative flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.17em] text-[#F59E0B]">
          <Target className="h-3.5 w-3.5" /> Minha missão de hoje
        </p>
        {mission ? (
          <>
            <h2 className={`mt-4 max-w-2xl text-xl font-semibold leading-8 sm:text-2xl ${mission.completed ? 'text-[#71717A] line-through' : 'text-white'}`}>
              {mission.title}
            </h2>
            <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${mutedText}`}>
              {projectName && <span className="inline-flex items-center gap-1.5"><FolderKanban className="h-3.5 w-3.5" />{projectName}</span>}
              {mission.dueAt && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Prazo {new Intl.DateTimeFormat('pt-BR').format(new Date(`${mission.dueAt}T12:00:00`))}</span>}
              <span className={`rounded-full px-2 py-1 text-[10px] ${mission.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#F59E0B]/10 text-[#FBBF24]'}`}>
                {mission.completed ? 'Concluída' : 'Em andamento'}
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-xl font-semibold text-white sm:text-2xl">Qual é a única coisa que faria hoje valer a pena?</h2>
            <p className={`mt-2 text-sm ${mutedText}`}>Escolha um norte para o seu dia. Você pode ajustar a missão quando precisar.</p>
          </>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={onEdit} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#D4D4D8] transition-colors hover:border-[#F59E0B]/30 hover:text-white">
          {mission ? 'Editar missão' : 'Definir missão'}
        </button>
        {mission && !mission.completed && (
          <button type="button" onClick={onComplete} className="inline-flex items-center gap-1.5 rounded-lg bg-[#F59E0B] px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#FBBF24]">
            <Check className="h-3.5 w-3.5" /> Concluir
          </button>
        )}
      </div>
    </div>
  </section>
);

interface PrioritiesCardProps {
  tasks: DashboardTask[];
  projects: DashboardProject[];
  search: string;
  onToggle: (id: string) => void;
  onEdit: (task: DashboardTask) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onAdd: () => void;
}

export const PrioritiesCard: React.FC<PrioritiesCardProps> = ({ tasks, projects, search, onToggle, onEdit, onDelete, onMove, onAdd }) => {
  const filteredTasks = tasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Suas 3 prioridades</h2>
          <p className={`mt-1 text-xs ${mutedText}`}>{tasks.length} de 3 prioridades planejadas</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={tasks.length >= 3}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#D4D4D8] transition-colors hover:border-[#F59E0B]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
      </div>
      <div className="mt-4 divide-y divide-white/[0.06]">
        {filteredTasks.map((task, index) => {
          const taskPosition = tasks.findIndex((item) => item.id === task.id);
          const project = projects.find((item) => item.id === task.projectId);
          const dependency = tasks.find((item) => item.id === task.dependsOnId);
          return (
            <div key={task.id} className="group flex items-start gap-3 py-3.5 first:pt-1">
              <button type="button" onClick={() => onToggle(task.id)} className={`mt-0.5 shrink-0 transition-colors ${task.completed ? 'text-[#F59E0B]' : 'text-[#52525B] hover:text-[#F59E0B]'}`} aria-label={task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`}>
                {task.completed ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <Circle className="h-[18px] w-[18px]" />}
              </button>
              <button type="button" onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left">
                <span className={`block truncate text-[13px] ${task.completed ? 'text-[#71717A] line-through' : 'text-[#E4E4E7]'}`}>{task.title}</span>
                <span className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] ${mutedText}`}>
                  <span>{project?.name || 'Sem projeto'}</span>
                  <span className={task.priority === 'Alta' ? 'text-[#F59E0B]' : ''}>{task.priority}</span>
                  <span>{formatDuration(task.estimatedMinutes)}</span>
                  {dependency && <span className={!dependency.completed ? 'text-amber-300' : ''}>{dependency.completed ? `Após ${dependency.title}` : `Aguardando ${dependency.title}`}</span>}
                  {task.dueAt && <span>Prazo {new Intl.DateTimeFormat('pt-BR').format(new Date(`${task.dueAt}T12:00:00`))}</span>}
                  {task.scheduledAt && <span>{task.scheduledAt}</span>}
                </span>
              </button>
              <span className="pt-0.5 font-mono text-[10px] text-[#52525B]">{String(index + 1).padStart(2, '0')}</span>
              <span className="flex flex-col">
                <button type="button" disabled={taskPosition === 0} onClick={() => onMove(task.id, -1)} className="rounded p-0.5 text-[#52525B] hover:text-white disabled:opacity-20" aria-label={`Mover ${task.title} para cima`}><MoveUp className="h-3 w-3" /></button>
                <button type="button" disabled={taskPosition === tasks.length - 1} onClick={() => onMove(task.id, 1)} className="rounded p-0.5 text-[#52525B] hover:text-white disabled:opacity-20" aria-label={`Mover ${task.title} para baixo`}><MoveDown className="h-3 w-3" /></button>
              </span>
              <button type="button" onClick={() => onDelete(task.id)} className="rounded p-1 text-[#52525B] opacity-100 transition-colors hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Excluir ${task.title}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="py-8 text-center">
            <ListTodo className="mx-auto h-6 w-6 text-[#52525B]" />
            <p className="mt-2 text-xs text-[#71717A]">{search ? 'Nenhuma tarefa corresponde à busca.' : 'Adicione até três prioridades para começar.'}</p>
          </div>
        )}
      </div>
    </section>
  );
};

interface ProgressCardProps {
  tasks: DashboardTask[];
  focusMinutes: number;
  focusGoalMinutes: number;
  mission: DailyMission | null;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ tasks, focusMinutes, focusGoalMinutes, mission }) => {
  const completed = tasks.filter((task) => task.completed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const focusProgress = focusGoalMinutes ? Math.min(100, Math.round((focusMinutes / focusGoalMinutes) * 100)) : 0;
  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Progresso de hoje</p>
          <p className={`mt-1 text-xs ${mutedText}`}>{completed} de {tasks.length} tarefas concluídas</p>
        </div>
        <span className="font-mono text-2xl font-semibold text-[#FBBF24]">{progress}%</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-[#F59E0B] transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.035] p-3">
          <p className={`text-[10px] uppercase tracking-wider ${mutedText}`}>Tempo em foco</p>
          <p className="mt-1.5 text-sm font-semibold text-white">{formatDuration(focusMinutes)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.035] p-3">
          <p className={`text-[10px] uppercase tracking-wider ${mutedText}`}>Meta diária</p>
          <p className="mt-1.5 text-sm font-semibold text-white">{formatDuration(focusGoalMinutes)} <span className="text-[10px] font-normal text-[#71717A]">· {focusProgress}%</span></p>
        </div>
      </div>
      <p className={`mt-4 flex items-center gap-2 text-xs ${mutedText}`}>
        <Target className="h-3.5 w-3.5 text-[#F59E0B]" />
        Missão: {mission ? (mission.completed ? 'concluída' : 'em andamento') : 'ainda não definida'}
      </p>
    </section>
  );
};

interface FocusCardProps {
  activeFocus: ActiveFocusSession | null;
  activeTask?: DashboardTask;
  focusMinutes: number;
  focusGoalMinutes: number;
  focusHistory: FocusSession[];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRest: () => void;
  onFinish: (completed: boolean) => void;
}

export const FocusCard: React.FC<FocusCardProps> = ({
  activeFocus, activeTask, focusMinutes, focusGoalMinutes, focusHistory,
  onStart, onPause, onResume, onRest, onFinish,
}) => {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = activeFocus
    ? activeFocus.elapsedBeforePauseMs + (activeFocus.startedAt ? now - activeFocus.startedAt : 0)
    : 0;
  const remaining = activeFocus?.durationMinutes ? Math.max(0, activeFocus.durationMinutes * 60_000 - elapsed) : null;
  const displayMs = remaining ?? elapsed;
  const timerText = `${String(Math.floor(displayMs / 60_000)).padStart(2, '0')}:${String(Math.floor((displayMs % 60_000) / 1000)).padStart(2, '0')}`;
  const progress = activeFocus?.durationMinutes
    ? Math.min(100, (elapsed / (activeFocus.durationMinutes * 60_000)) * 100)
    : 0;
  const todaySessions = focusHistory.filter((session) => session.mode !== 'Descanso' && new Date(session.startedAt).toDateString() === new Date().toDateString());

  return (
    <section className={`${cardClass} relative overflow-hidden`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><Focus className="h-4 w-4 text-[#F59E0B]" /> Hora de entrar em foco.</p>
          <p className={`mt-1 text-xs ${mutedText}`}>{activeFocus ? activeTask?.title || (activeFocus.mode === 'Descanso' ? 'Pausa curta' : 'Sessão de foco') : 'Escolha uma tarefa e comece no seu ritmo.'}</p>
        </div>
        <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] text-[#A1A1AA]">
          {activeFocus?.mode || 'Focus Mode'}
        </span>
      </div>
      <div className="mt-5 flex flex-col items-center">
        <p className="font-mono text-5xl font-light tracking-tight text-white tabular-nums sm:text-6xl" aria-live="off">{timerText}</p>
        <div className="mt-4 h-1 w-full max-w-[15rem] overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-[#F59E0B] transition-[width] duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {!activeFocus ? (
            <button type="button" onClick={onStart} className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#FBBF24]">
              <Play className="h-3.5 w-3.5 fill-current" /> Iniciar foco
            </button>
          ) : (
            <>
              {activeFocus.startedAt ? (
                <button type="button" onClick={onPause} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2.5 text-xs font-medium text-white hover:bg-white/5">
                  <Pause className="h-3.5 w-3.5" /> Pausar
                </button>
              ) : (
                <button type="button" onClick={onResume} className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-3.5 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">
                  <Play className="h-3.5 w-3.5 fill-current" /> Retomar
                </button>
              )}
              <button type="button" onClick={() => onFinish(true)} className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 px-3.5 py-2.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10">
                <Check className="h-3.5 w-3.5" /> Finalizar
              </button>
              {activeFocus.mode !== 'Descanso' && <button type="button" onClick={onRest} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#A1A1AA] hover:text-white">Descanso 5 min</button>}
              <button type="button" onClick={() => onFinish(false)} className="rounded-lg px-2.5 py-2.5 text-xs text-[#71717A] hover:text-red-400">Interromper</button>
            </>
          )}
        </div>
      </div>
      <div className={`mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[11px] ${mutedText}`}>
        <span>Hoje em foco: {formatDuration(focusMinutes)} / {formatDuration(focusGoalMinutes)}</span>
        <span>{todaySessions.length} {todaySessions.length === 1 ? 'sessão' : 'sessões'}</span>
      </div>
    </section>
  );
};

interface NextActionProps {
  task?: DashboardTask;
  projectName?: string;
  onStart: (task: DashboardTask) => void;
  onAdd: () => void;
}

export const NextActionCard: React.FC<NextActionProps> = ({ task, projectName, onStart, onAdd }) => (
  <section className={`${cardClass} border-[#F59E0B]/15`}>
    <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#F59E0B]">
      <ArrowRight className="h-3.5 w-3.5" /> O que fazer agora?
    </p>
    {task ? (
      <>
        <h2 className="mt-4 text-base font-semibold leading-6 text-white">{task.title}</h2>
        <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] ${mutedText}`}>
          <span>{projectName || 'Sem projeto'}</span><span>{task.priority} prioridade</span><span>{formatDuration(task.estimatedMinutes)}</span>
          {task.dueAt && <span>Prazo {new Intl.DateTimeFormat('pt-BR').format(new Date(`${task.dueAt}T12:00:00`))}</span>}
        </div>
        <button type="button" onClick={() => onStart(task)} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#FBBF24] transition-colors hover:text-white">
          Começar agora <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </>
    ) : (
      <>
        <h2 className="mt-4 text-sm font-medium text-white">Ainda não há uma próxima tarefa.</h2>
        <p className={`mt-1 text-xs ${mutedText}`}>Cadastre uma prioridade para escolher seu próximo passo.</p>
        <button type="button" onClick={onAdd} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#FBBF24] hover:text-white">
          Adicionar prioridade <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </>
    )}
  </section>
);

interface ProjectsProps {
  projects: DashboardProject[];
  tasks: DashboardTask[];
  onAdd: () => void;
  onOpen: () => void;
}

export const ProjectsCard: React.FC<ProjectsProps> = ({ projects, tasks, onAdd, onOpen }) => (
  <section className={cardClass}>
    <div className="flex items-center justify-between">
      <div><h2 className="text-sm font-semibold text-white">Meus projetos</h2><p className={`mt-1 text-xs ${mutedText}`}>Acompanhe o que está em andamento.</p></div>
      <button type="button" onClick={onAdd} className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-[#FBBF24]" aria-label="Criar projeto"><Plus className="h-4 w-4" /></button>
    </div>
    {projects.length ? (
      <div className="mt-4 space-y-3">
        {projects.slice(0, 3).map((project) => {
          const projectTasks = tasks.filter((task) => task.projectId === project.id);
          const done = projectTasks.filter((task) => task.completed).length;
          const progress = projectTasks.length ? Math.round(done / projectTasks.length * 100) : 0;
          return (
            <div key={project.id} className="rounded-xl bg-white/[0.025] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-xs font-medium text-[#E4E4E7]">{project.name}</p><p className={`mt-1 truncate text-[10px] ${mutedText}`}>{project.description || `${projectTasks.length} tarefas`}</p></div>
                <span className="font-mono text-xs text-[#FBBF24]">{progress}%</span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-[#F59E0B] transition-all" style={{ width: `${progress}%` }} /></div>
              <p className={`mt-2 text-[10px] ${mutedText}`}>{done}/{projectTasks.length} tarefas{project.dueAt ? ` · prazo ${new Intl.DateTimeFormat('pt-BR').format(new Date(`${project.dueAt}T12:00:00`))}` : ''}</p>
            </div>
          );
        })}
        <button type="button" onClick={onOpen} className="pt-1 text-xs font-medium text-[#A1A1AA] hover:text-white">Ver todos os projetos <ArrowRight className="ml-1 inline h-3 w-3" /></button>
      </div>
    ) : (
      <div className="mt-5 rounded-xl border border-dashed border-white/10 p-4 text-center">
        <FolderKanban className="mx-auto h-5 w-5 text-[#52525B]" />
        <p className={`mt-2 text-xs ${mutedText}`}>Seus projetos aparecerão aqui.</p>
        <button type="button" onClick={onAdd} className="mt-3 text-xs font-semibold text-[#FBBF24] hover:text-white">Criar primeiro projeto</button>
      </div>
    )}
  </section>
);

interface ScheduleProps {
  schedule: ScheduleItem[];
  onAdd: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenPlanner?: () => void;
}

export const ScheduleCard: React.FC<ScheduleProps> = ({ schedule, onAdd, onToggle, onDelete, onOpenPlanner }) => (
  <section className={cardClass}>
    <div className="flex items-center justify-between gap-3">
      <div><h2 className="text-sm font-semibold text-white">Agenda de hoje</h2><p className={`mt-1 text-xs ${mutedText}`}>Seu dia, no seu ritmo.</p></div>
      <div className="flex items-center gap-1">
        {onOpenPlanner && <button type="button" onClick={onOpenPlanner} className="rounded-lg px-2 py-1.5 text-[10px] text-[#FBBF24] hover:bg-white/5">Abrir Planner</button>}
        <button type="button" onClick={onAdd} className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-[#FBBF24]" aria-label="Adicionar atividade à agenda"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
    {schedule.length ? (
      <div className="mt-4 space-y-1">
        {[...schedule].sort((a, b) => a.time.localeCompare(b.time)).map((item) => (
          <div key={item.id} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/[0.025]">
            <span className="w-11 shrink-0 font-mono text-[11px] text-[#FBBF24]">{item.time}</span>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.completed ? 'bg-[#52525B]' : 'bg-[#F59E0B]'}`} />
            <button type="button" onClick={() => onToggle(item.id)} className={`min-w-0 flex-1 truncate text-left text-xs ${item.completed ? 'text-[#71717A] line-through' : 'text-[#D4D4D8]'}`}>{item.title}</button>
            <span className={`shrink-0 text-[10px] ${mutedText}`}>{item.durationMinutes}m</span>
            <button type="button" onClick={() => onDelete(item.id)} className="text-[#52525B] opacity-100 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Excluir ${item.title}`}><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
    ) : (
      <div className="mt-5 rounded-xl border border-dashed border-white/10 p-4 text-center">
        <Clock3 className="mx-auto h-5 w-5 text-[#52525B]" />
        <p className={`mt-2 text-xs ${mutedText}`}>Nenhuma atividade planejada.</p>
        <button type="button" onClick={onAdd} className="mt-3 text-xs font-semibold text-[#FBBF24] hover:text-white">Adicionar atividade</button>
      </div>
    )}
  </section>
);

interface AiProps {
  task?: DashboardTask;
  action: string;
  onChoose: (action: string) => void;
}

export const DailyAiCard: React.FC<AiProps> = ({ task, action, onChoose }) => {
  const actions = ['Organizar meu dia', 'Priorizar tarefas', 'Estou perdido', 'Dividir uma tarefa', 'Replanejar meu dia', 'Analisar meu progresso'];
  const recommendation = action === 'Estou perdido'
    ? task
      ? `Abra “${task.title}” e dedique apenas 5 minutos ao primeiro passo. Não precisa terminar agora; só comece.`
      : 'Anote uma única tarefa que está na sua cabeça e escolha o primeiro passo de 5 minutos.'
    : action === 'Priorizar tarefas'
      ? task ? `Sua próxima prioridade sugerida é “${task.title}”, considerando as prioridades e prazos cadastrados.` : 'Cadastre suas prioridades para receber uma sugestão baseada no seu dia.'
      : action === 'Dividir uma tarefa'
        ? task ? `Para “${task.title}”, escreva o resultado esperado e transforme-o em uma primeira ação que leve até 15 minutos.` : 'Escolha uma tarefa e descreva o primeiro passo que levaria até 15 minutos.'
        : task ? `Comece por “${task.title}”. Revise sua agenda e reserve um bloco de ${task.estimatedMinutes} minutos sem interrupções.` : 'Defina sua missão e uma prioridade para organizar seu dia.';

  return (
    <section className={`${cardClass} border-[#F59E0B]/15`}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#FBBF24]"><Sparkles className="h-4 w-4" /></span>
        <div><p className="text-sm font-semibold text-white">UMBRA AI</p><p className={`mt-0.5 text-xs ${mutedText}`}>Seu copiloto de execução.</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {actions.map((item) => (
          <button key={item} type="button" onClick={() => onChoose(item)} className={`rounded-lg border px-2.5 py-2 text-left text-[10px] transition-colors sm:text-[11px] ${action === item ? 'border-[#F59E0B]/30 bg-[#F59E0B]/[0.08] text-[#FBBF24]' : 'border-white/[0.07] text-[#A1A1AA] hover:border-white/15 hover:text-white'}`}>
            {item}
          </button>
        ))}
      </div>
      {action && (
        <div className="mt-3 rounded-xl border border-[#F59E0B]/15 bg-[#F59E0B]/[0.04] p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#FBBF24]"><WandSparkles className="h-3.5 w-3.5" /> Próximo passo</p>
          <p className="mt-1.5 text-xs leading-5 text-[#D4D4D8]">{recommendation}</p>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-4 text-[#71717A]">
        <Lightbulb className="mr-1 inline h-3 w-3" />
        Sugestões locais, sem IA conectada. Nenhuma tarefa ou compromisso é alterado automaticamente.
      </p>
    </section>
  );
};

interface AlertsProps {
  messages: string[];
  onDefineMission: () => void;
}

export const AlertsCard: React.FC<AlertsProps> = ({ messages, onDefineMission }) => (
  <section className={cardClass}>
    <div className="flex items-center gap-2">
      <TriangleAlert className={`h-4 w-4 ${messages.length ? 'text-[#F59E0B]' : 'text-[#71717A]'}`} />
      <h2 className="text-sm font-semibold text-white">Atenção</h2>
      {messages.length > 0 && <span className="rounded-full bg-[#F59E0B]/10 px-2 py-0.5 text-[10px] text-[#FBBF24]">{messages.length}</span>}
    </div>
    {messages.length ? (
      <ul className="mt-3 space-y-2">{messages.map((message) => <li key={message} className="flex items-start gap-2 text-xs leading-5 text-[#A1A1AA]"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#F59E0B]" />{message}</li>)}</ul>
    ) : (
      <p className={`mt-3 text-xs ${mutedText}`}>Nenhuma pendência exige atenção agora.</p>
    )}
    {messages.some((message) => message.includes('missão')) && <button type="button" onClick={onDefineMission} className="mt-3 text-xs font-semibold text-[#FBBF24] hover:text-white">Definir missão <ArrowRight className="ml-1 inline h-3 w-3" /></button>}
  </section>
);

export const EmptyModule: React.FC<{ module: DashboardModule; onBack: () => void }> = ({ module, onBack }) => (
  <div className={`${cardClass} flex min-h-[22rem] flex-col items-center justify-center text-center`}>
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F59E0B]/15 bg-[#F59E0B]/[0.07] text-[#FBBF24]"><Sparkles className="h-5 w-5" /></span>
    <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#F59E0B]">Próximamente</p>
    <h2 className="mt-2 text-xl font-semibold text-white">{module}</h2>
    <p className={`mt-2 max-w-sm text-sm leading-6 ${mutedText}`}>Este módulo ainda está em desenvolvimento. Seus dados continuam no seu espaço local e você pode voltar ao dashboard a qualquer momento.</p>
    <button type="button" onClick={onBack} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">Voltar ao dashboard <ArrowRight className="h-3.5 w-3.5" /></button>
  </div>
);
