import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Lightbulb, LoaderCircle, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { createId, localDateKey } from './dashboardService';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar, type DashboardModule } from './DashboardSidebar';
import {
  IdeaDialog, MissionDialog, RecoveryDialog, ScheduleDialog, TaskDialog,
} from './DashboardDialogs';
import {
  AlertsCard, DailyAiCard, EmptyModule, FocusCard, MissionCard, NextActionCard,
  PrioritiesCard, ProgressCard, ProjectsCard, ScheduleCard,
} from './DashboardWidgets';
import { useDashboard } from './useDashboard';
import { TaskManagerPage } from './TaskManagerPage';
import { ProjectManagerPage } from './ProjectManagerPage';
import { FocusModePage } from './FocusModePage';
import type {
  ActiveFocusSession, DashboardProject, DashboardTask, DailyMission, FocusSession, FocusSessionConfig, Idea, ProjectPhase,
  ScheduleItem,
} from './types';

type DialogName = 'mission' | 'task' | 'schedule' | 'idea' | 'recovery' | null;

interface DashboardPageProps {
  onExit: () => void;
}

const inputClass = 'w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#F59E0B]/50';

export const DashboardPage: React.FC<DashboardPageProps> = ({ onExit }) => {
  const { data, update, loaded, error, reset } = useDashboard();
  const [activeModule, setActiveModule] = useState<DashboardModule>(() => {
    const path = window.location.hash;
    if (window.location.pathname === '/focus') return 'Focus Mode';
    if (path === '#/tarefas') return 'Tarefas';
    if (path === '#/projetos' || path.startsWith('#/projetos/')) return 'Projetos';
    if (path === '#/focus') return 'Focus Mode';
    return 'Dashboard';
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    const match = window.location.hash.match(/^#\/projetos\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogName>(null);
  const [editingTask, setEditingTask] = useState<DashboardTask | null>(null);
  const [search, setSearch] = useState('');
  const [aiAction, setAiAction] = useState('');
  const [toast, setToast] = useState('');
  const [tick, setTick] = useState(Date.now());
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingMission, setOnboardingMission] = useState('');
  const [onboardingPriorities, setOnboardingPriorities] = useState(['', '', '']);
  const [onboardingGoal, setOnboardingGoal] = useState('120');
  const [onboardingProject, setOnboardingProject] = useState('');
  const [newIdeaId, setNewIdeaId] = useState('');
  const [taskProjectFilterId, setTaskProjectFilterId] = useState('');
  const [focusInitialTaskId, setFocusInitialTaskId] = useState('');
  const [focusInitialProjectId, setFocusInitialProjectId] = useState('');

  const navigateModule = (module: DashboardModule, projectId?: string) => {
    setActiveModule(module);
    setSelectedProjectId(module === 'Projetos' ? projectId || null : null);
    setTaskProjectFilterId(module === 'Tarefas' ? projectId || '' : '');
    const path = module === 'Tarefas' ? '/#/tarefas' : module === 'Projetos' ? (projectId ? `/#/projetos/${encodeURIComponent(projectId)}` : '/#/projetos') : module === 'Focus Mode' ? '/focus' : '/#/dashboard';
    window.history.pushState({}, '', path);
  };

  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.hash;
      if (window.location.pathname === '/focus' || path === '#/focus') {
        setActiveModule('Focus Mode');
        setSelectedProjectId(null);
      } else if (path === '#/tarefas') {
        setActiveModule('Tarefas');
        setSelectedProjectId(null);
      } else if (path === '#/projetos' || path.startsWith('#/projetos/')) {
        setActiveModule('Projetos');
        const match = path.match(/^#\/projetos\/([^/]+)$/);
        setSelectedProjectId(match ? decodeURIComponent(match[1]) : null);
      } else if (path === '#/dashboard') {
        setActiveModule('Dashboard');
        setSelectedProjectId(null);
      }
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  };

  const elapsedFocusMs = useMemo(() => {
    const active = data.activeFocus;
    if (!active) return 0;
    return active.elapsedBeforePauseMs + (active.startedAt ? tick - active.startedAt : 0);
  }, [data.activeFocus, tick]);

  const finishFocus = (completed: boolean) => {
    const active = data.activeFocus;
    if (!active) return;
    const elapsed = active.elapsedBeforePauseMs + (active.startedAt ? Date.now() - active.startedAt : 0);
    const elapsedSeconds = Math.max(0, Math.floor(elapsed / 1000));
    const isBreak = active.phase === 'break' || active.mode === 'Descanso';
    const sessionId = active.id || `${active.sessionStartedAt}-${active.taskId || 'open'}`;
    update((current) => {
      if (!current.activeFocus || (current.activeFocus.id && current.activeFocus.id !== sessionId)) return current;
      if (isBreak) {
        const focusHistory = active.parentSessionId
          ? current.focusHistory.map((session) => session.id === active.parentSessionId
              ? { ...session, breakSeconds: (session.breakSeconds || 0) + elapsedSeconds }
              : session)
          : current.focusHistory;
        const canStartNext = completed && active.autoNextCycle && (active.cycleIndex || 1) < (active.totalCycles || 1);
        const nextStartedAt = Date.now();
        return {
          ...current,
          focusHistory,
          activeFocus: canStartNext ? {
            ...active,
            id: createId(),
            mode: active.focusMode || 'Pomodoro',
            phase: 'focus',
            durationMinutes: active.focusDurationMinutes ?? 25,
            sessionStartedAt: nextStartedAt,
            startedAt: nextStartedAt,
            pausedAt: null,
            elapsedBeforePauseMs: 0,
            cycleIndex: (active.cycleIndex || 1) + 1,
          } : null,
        };
      }

      const focusMode = active.focusMode || active.mode;
      const entry: FocusSession = {
        id: sessionId,
        taskId: active.taskId,
        projectId: active.projectId || null,
        mode: focusMode,
        startedAt: active.sessionStartedAt,
        endedAt: Date.now(),
        durationMinutes: Math.floor(elapsedSeconds / 60),
        completed,
        status: completed ? 'Concluída' : 'Interrompida',
        targetDurationSeconds: active.durationMinutes ? active.durationMinutes * 60 : null,
        actualFocusSeconds: elapsedSeconds,
        breakSeconds: 0,
        concentrationRating: null,
        notes: '',
        cycleIndex: active.cycleIndex || 1,
      };
      const hasSession = current.focusHistory.some((session) => session.id === sessionId);
      return {
        ...current,
        activeFocus: null,
        focusHistory: elapsedSeconds > 0 && !hasSession ? [entry, ...current.focusHistory] : current.focusHistory,
        tasks: active.taskId && elapsedSeconds > 0 && !hasSession
          ? current.tasks.map((task) => task.id === active.taskId ? {
              ...task,
              actualSeconds: (task.actualSeconds ?? task.actualMinutes * 60) + elapsedSeconds,
              actualMinutes: Math.floor(((task.actualSeconds ?? task.actualMinutes * 60) + elapsedSeconds) / 60),
              history: [{ id: createId(), action: `Sessão de foco: ${Math.floor(elapsedSeconds / 60)} min`, createdAt: Date.now() }, ...task.history],
              updatedAt: Date.now(),
            } : task)
          : current.tasks,
      };
    });
    if (isBreak) notify(completed ? 'Descanso finalizado.' : 'Descanso interrompido.');
    else notify(completed ? 'Sessão de foco registrada.' : 'Sessão interrompida e registrada.');
  };

  useEffect(() => {
    const active = data.activeFocus;
    if (activeModule !== 'Focus Mode' && active?.durationMinutes && elapsedFocusMs >= active.durationMinutes * 60_000) {
      if (active.phase === 'break' || active.mode === 'Descanso') {
        finishFocus(true);
      } else if (active.autoBreak && (active.breakDurationMinutes || 0) > 0) {
        startBreak({
          taskId: active.taskId,
          projectId: active.projectId || null,
          mode: active.focusMode || active.mode,
          durationMinutes: active.focusDurationMinutes ?? active.durationMinutes,
          breakDurationMinutes: active.breakDurationMinutes || 5,
          cycles: active.totalCycles || 1,
          autoBreak: active.autoBreak,
          autoNextCycle: active.autoNextCycle || false,
        });
      } else {
        finishFocus(true);
      }
    }
  }, [data.activeFocus, elapsedFocusMs, activeModule]);

  const todayFocusMinutes = useMemo(() => {
    const today = localDateKey();
    const historySeconds = data.focusHistory
      .filter((session) => session.mode !== 'Descanso' && localDateKey(new Date(session.startedAt)) === today)
      .reduce((total, session) => total + (session.actualFocusSeconds ?? session.durationMinutes * 60), 0);
    const activeMinutes = data.activeFocus && data.activeFocus.mode !== 'Descanso' && localDateKey(new Date(data.activeFocus.sessionStartedAt)) === today
      ? Math.floor(elapsedFocusMs / 60_000)
      : 0;
    return Math.floor(historySeconds / 60) + activeMinutes;
  }, [data.focusHistory, data.activeFocus, elapsedFocusMs]);

  const today = localDateKey();
  const todayTasks = data.dailyPriorityIds
    .map((id) => data.tasks.find((task) => task.id === id))
    .filter((task): task is DashboardTask => Boolean(task && task.day === today && !task.archivedAt));
  const todaySchedule = [
    ...data.schedule.filter((item) => item.day === today),
    ...todayTasks.filter((task) => task.scheduledAt).map((task) => ({
      id: `task-${task.id}`,
      day: today,
      title: task.title,
      time: task.scheduledAt,
      durationMinutes: task.estimatedMinutes,
      completed: task.status === 'Concluído',
    })),
  ];
  const pendingTasks = todayTasks.filter((task) => !task.completed && (
    !task.dependsOnId || data.tasks.find((dependency) => dependency.id === task.dependsOnId)?.completed
  ));
  const recommendedTask = [...pendingTasks].sort((a, b) => {
    const priority = { Urgente: 4, Alta: 3, Média: 2, Baixa: 1 };
    const score = (task: DashboardTask) => {
      const overdue = task.dueAt && task.dueAt < localDateKey() ? 100 : 0;
      const dueToday = task.dueAt === localDateKey() ? 30 : 0;
      const dueSoon = task.dueAt && task.dueAt > localDateKey() && task.dueAt <= localDateKey(new Date(Date.now() + 86_400_000)) ? 15 : 0;
      return overdue + dueToday + dueSoon + priority[task.priority] * 5;
    };
    return score(b) - score(a) || a.scheduledAt.localeCompare(b.scheduledAt);
  })[0];

  const alerts = useMemo(() => {
    const today = localDateKey();
    const tomorrow = localDateKey(new Date(Date.now() + 86_400_000));
    const messages = data.tasks
      .filter((task) => !task.completed && task.dueAt && task.dueAt < today)
      .map((task) => `Tarefa atrasada: ${task.title}.`);
    const dueSoon = data.tasks.filter((task) => !task.completed && (task.dueAt === today || task.dueAt === tomorrow));
    if (dueSoon.length) messages.push(`${dueSoon.length} tarefa(s) com prazo hoje ou amanhã.`);
    if (!data.mission && data.onboardingComplete) messages.push('Sua missão de hoje ainda não foi definida.');
    const blockedTasks = data.tasks.filter((task) => task.day === today && !task.completed && task.dependsOnId && !data.tasks.find((dependency) => dependency.id === task.dependsOnId)?.completed);
    if (blockedTasks.length) messages.push(`${blockedTasks.length} prioridade(s) aguardando outra tarefa.`);
    if (data.tasks.some((task) => !task.completed && !task.scheduledAt)) messages.push('Há prioridades sem horário planejado.');
    return messages;
  }, [data.tasks, data.mission, data.onboardingComplete, today]);

  const projectName = (id: string) => data.projects.find((project) => project.id === id)?.name;

  const saveMission = (mission: Omit<DailyMission, 'day'>) => {
    update((current) => ({ ...current, mission: { ...mission, day: today } }));
    setDialog(null);
    notify('Missão do dia salva.');
  };

  const saveTask = (task: Pick<DashboardTask, 'title' | 'projectId' | 'priority' | 'dependsOnId' | 'estimatedMinutes' | 'dueAt' | 'scheduledAt'>) => {
    if (editingTask) {
      update((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === editingTask.id ? { ...item, ...task, updatedAt: Date.now() } : item) }));
      notify('Prioridade atualizada.');
    } else {
      const id = createId();
      update((current) => ({ ...current, tasks: [...current.tasks, { ...task, id, day: today, createdAt: Date.now(), updatedAt: Date.now(), actualMinutes: 0, status: 'A fazer', completed: false, description: '', category: '', tags: [], startAt: '', recurrence: 'Não repetir', subtasks: [], notes: '', history: [], archivedAt: '' }], dailyPriorityIds: [...current.dailyPriorityIds, id] }));
      notify('Prioridade adicionada.');
    }
    setEditingTask(null);
    setDialog(null);
  };

  const saveManagedTask = (
    form: Omit<DashboardTask, 'id' | 'createdAt' | 'updatedAt' | 'history'>,
    existing?: DashboardTask,
    createAnother = false,
  ) => {
    const now = Date.now();
    const activity = {
      id: createId(),
      action: existing ? 'Tarefa atualizada' : 'Tarefa criada',
      createdAt: now,
    };
    update((current) => {
      const task: DashboardTask = existing
        ? { ...existing, ...form, completed: form.status === 'Concluído', updatedAt: now, history: [activity, ...existing.history] }
        : { ...form, id: createId(), day: '', actualMinutes: 0, createdAt: now, updatedAt: now, history: [activity] };
      return {
        ...current,
        tasks: existing
          ? current.tasks.map((item) => item.id === existing.id ? task : item)
          : [...current.tasks, task],
        projects: task.projectId
          ? current.projects.map((project) => project.id === task.projectId ? {
              ...project,
              activity: [{ id: createId(), action: existing ? `Tarefa atualizada: ${task.title}` : `Tarefa adicionada: ${task.title}`, createdAt: now }, ...project.activity],
            } : project)
          : current.projects,
      };
    });
    notify(existing ? 'Tarefa atualizada.' : 'Tarefa criada.');
    if (!createAnother) setDialog(null);
  };

  const updateTaskRecord = (task: DashboardTask, action: string) => {
    const activity = { id: createId(), action, createdAt: Date.now() };
    update((current) => ({
      ...current,
      tasks: current.tasks.some((item) => item.id === task.id)
        ? current.tasks.map((item) => item.id === task.id ? { ...task, updatedAt: Date.now(), history: [activity, ...item.history] } : item)
        : [...current.tasks, { ...task, createdAt: Date.now(), updatedAt: Date.now(), history: [activity, ...task.history] }],
      dailyPriorityIds: action === 'Tarefa excluída' ? current.dailyPriorityIds.filter((id) => id !== task.id) : current.dailyPriorityIds,
      projects: task.projectId
        ? current.projects.map((project) => project.id === task.projectId ? {
            ...project,
            activity: [{ id: createId(), action: `${action}: ${task.title}`, createdAt: Date.now() }, ...project.activity],
          } : project)
        : current.projects,
    }));
    notify(action);
  };

  const deleteTask = (task: DashboardTask) => {
    if (!window.confirm(`Excluir “${task.title}” e remover suas dependências?`)) return;
    update((current) => ({
      ...current,
      tasks: current.tasks
        .filter((item) => item.id !== task.id)
        .map((item) => item.dependsOnId === task.id ? { ...item, dependsOnId: '' } : item),
      dailyPriorityIds: current.dailyPriorityIds.filter((id) => id !== task.id),
      activeFocus: current.activeFocus?.taskId === task.id ? { ...current.activeFocus, taskId: null } : current.activeFocus,
      projects: task.projectId
        ? current.projects.map((project) => project.id === task.projectId ? {
            ...project,
            activity: [{ id: createId(), action: `Tarefa excluída: ${task.title}`, createdAt: Date.now() }, ...project.activity],
          } : project)
        : current.projects,
    }));
    notify('Tarefa excluída.');
  };

  const deleteProject = (project: DashboardProject) => {
    const linkedTasks = data.tasks.filter((task) => task.projectId === project.id);
    if (!window.confirm(`Excluir o projeto “${project.name}”? ${linkedTasks.length ? `${linkedTasks.length} tarefa(s) vinculada(s) ficarão sem projeto.` : ''}`)) return;
    update((current) => ({
      ...current,
      projects: current.projects.filter((item) => item.id !== project.id),
      tasks: current.tasks.map((task) => task.projectId === project.id ? { ...task, projectId: '' } : task),
      mission: current.mission?.projectId === project.id ? { ...current.mission, projectId: '' } : current.mission,
      ideas: current.ideas.map((idea) => idea.projectId === project.id ? { ...idea, projectId: '' } : idea),
    }));
    if (selectedProjectId === project.id) navigateModule('Projetos');
    notify('Projeto excluído; tarefas vinculadas foram preservadas.');
  };

  const updateProjectRecord = (project: DashboardProject, action: string) => {
    const activity = { id: createId(), action, createdAt: Date.now() };
    update((current) => ({
      ...current,
      projects: current.projects.map((item) => item.id === project.id
        ? { ...project, activity: project.activity[0]?.action === action ? project.activity : [activity, ...project.activity] }
        : item),
    }));
    notify(action);
  };

  const toggleDailyPriority = (task: DashboardTask) => {
    update((current) => {
      const selected = current.dailyPriorityIds.includes(task.id);
      if (!selected && current.dailyPriorityIds.length >= 3) {
        return current;
      }
      return {
        ...current,
        dailyPriorityIds: selected
          ? current.dailyPriorityIds.filter((id) => id !== task.id)
          : [...current.dailyPriorityIds, task.id],
        tasks: current.tasks.map((item) => item.id === task.id ? { ...item, day: selected ? '' : today } : item),
      };
    });
    if (!data.dailyPriorityIds.includes(task.id) && data.dailyPriorityIds.length >= 3) notify('Você pode selecionar no máximo três prioridades para hoje.');
    else if (!data.dailyPriorityIds.includes(task.id)) notify('Tarefa adicionada às prioridades de hoje.');
    else if (data.dailyPriorityIds.includes(task.id)) notify('Tarefa removida das prioridades de hoje.');
  };

  const saveProject = (project: Omit<DashboardProject, 'id' | 'createdAt' | 'phases' | 'milestones' | 'activity' | 'files'>, existing?: DashboardProject, phases: ProjectPhase[] = []) => {
    update((current) => ({
      ...current,
      projects: existing
        ? current.projects.map((item) => item.id === existing.id ? {
            ...item, ...project,
            phases,
            activity: [{ id: createId(), action: 'Projeto atualizado', createdAt: Date.now() }, ...item.activity],
          } : item)
        : [...current.projects, {
            ...project, id: createId(), createdAt: Date.now(),
            phases, milestones: [], activity: [{ id: createId(), action: 'Projeto criado', createdAt: Date.now() }], files: [],
          }],
    }));
    setDialog(null);
    notify(existing ? 'Projeto atualizado.' : 'Projeto criado.');
  };

  const saveSchedule = (item: Omit<ScheduleItem, 'id' | 'completed' | 'day'>) => {
    update((current) => ({ ...current, schedule: [...current.schedule, { ...item, id: createId(), day: today, completed: false }] }));
    setDialog(null);
    notify('Atividade adicionada à agenda.');
  };

  const saveIdea = (idea: Omit<Idea, 'id' | 'createdAt'>) => {
    const savedIdea = { ...idea, id: createId(), createdAt: Date.now() };
    update((current) => ({ ...current, ideas: [savedIdea, ...current.ideas] }));
    setNewIdeaId(savedIdea.id);
    setDialog(null);
    notify('Ideia salva no cofre.');
  };

  const startFocus = (options: FocusSessionConfig) => {
    const now = Date.now();
    const session: ActiveFocusSession = {
      taskId: options.taskId,
      projectId: options.projectId,
      mode: options.mode,
      durationMinutes: options.durationMinutes,
      breakDurationMinutes: options.breakDurationMinutes,
      totalCycles: options.cycles,
      autoBreak: options.autoBreak,
      autoNextCycle: options.autoNextCycle,
      id: createId(),
      phase: 'focus',
      focusMode: options.mode,
      focusDurationMinutes: options.durationMinutes,
      cycleIndex: 1,
      openEnded: options.durationMinutes === null,
      sessionStartedAt: now,
      startedAt: now,
      pausedAt: null,
      elapsedBeforePauseMs: 0,
    };
    update((current) => ({ ...current, activeFocus: session }));
    notify('Sessão de foco pronta.');
  };

  const pauseFocus = () => update((current) => {
    const active = current.activeFocus;
    if (!active?.startedAt) return current;
    const now = Date.now();
    return {
      ...current,
      activeFocus: {
        ...active,
        elapsedBeforePauseMs: active.elapsedBeforePauseMs + now - active.startedAt,
        startedAt: null,
        pausedAt: now,
      },
    };
  });

  const resumeFocus = () => update((current) => current.activeFocus
    ? { ...current, activeFocus: { ...current.activeFocus, startedAt: Date.now(), pausedAt: null } }
    : current);

  const startBreak = (config?: FocusSessionConfig, parentSessionId?: string) => {
    const now = Date.now();
    update((current) => {
      const running = current.activeFocus;
      const isRunningFocus = running && running.mode !== 'Descanso' && running.phase !== 'break';
      const elapsedSeconds = isRunningFocus
        ? Math.max(0, Math.floor((running.elapsedBeforePauseMs + (running.startedAt ? now - running.startedAt : 0)) / 1000))
        : 0;
      const priorId = parentSessionId || (isRunningFocus ? running.id || `${running.sessionStartedAt}-${running.taskId || 'open'}` : null);
      let focusHistory = current.focusHistory;
      let tasks = current.tasks;
      if (isRunningFocus && elapsedSeconds > 0 && !focusHistory.some((session) => session.id === priorId)) {
        const entry: FocusSession = {
          id: priorId!,
          taskId: running.taskId,
          projectId: running.projectId || null,
          mode: running.focusMode || running.mode,
          startedAt: running.sessionStartedAt,
          endedAt: now,
          durationMinutes: Math.floor(elapsedSeconds / 60),
          completed: true,
          status: 'Concluída',
          targetDurationSeconds: running.durationMinutes ? running.durationMinutes * 60 : null,
          actualFocusSeconds: elapsedSeconds,
          breakSeconds: 0,
          concentrationRating: null,
          notes: '',
          cycleIndex: running.cycleIndex || 1,
        };

        focusHistory = [entry, ...focusHistory];
        if (running.taskId) tasks = tasks.map((task) => task.id === running.taskId ? {
          ...task,
          actualSeconds: (task.actualSeconds ?? task.actualMinutes * 60) + elapsedSeconds,
          actualMinutes: Math.floor(((task.actualSeconds ?? task.actualMinutes * 60) + elapsedSeconds) / 60),
          history: [{ id: createId(), action: `Sessão de foco: ${Math.floor(elapsedSeconds / 60)} min`, createdAt: now }, ...task.history],
          updatedAt: now,
        } : task);
      }
      const settings = config || (running ? {
        taskId: running.taskId,
        projectId: running.projectId || null,
        mode: running.focusMode || running.mode,
        durationMinutes: running.focusDurationMinutes ?? running.durationMinutes,
        breakDurationMinutes: running.breakDurationMinutes || 5,
        cycles: running.totalCycles || 1,
        autoBreak: running.autoBreak || false,
        autoNextCycle: running.autoNextCycle || false,
      } : null);
      if (!settings || settings.breakDurationMinutes < 1) return { ...current, focusHistory, tasks, activeFocus: null };
      return {
        ...current,
        focusHistory,
        tasks,
        activeFocus: {
          id: createId(),
          taskId: settings.taskId,
          projectId: settings.projectId,
          mode: 'Descanso',
          phase: 'break',
          focusMode: settings.mode,
          focusDurationMinutes: settings.durationMinutes,
          durationMinutes: settings.breakDurationMinutes,
          breakDurationMinutes: settings.breakDurationMinutes,
          totalCycles: settings.cycles,
          cycleIndex: running?.cycleIndex || 1,
          autoBreak: settings.autoBreak,
          autoNextCycle: settings.autoNextCycle,
          parentSessionId: priorId,
          sessionStartedAt: now,
          startedAt: now,
          pausedAt: null,
          elapsedBeforePauseMs: 0,
        },
      };
    });
    notify('Pausa iniciada.');
  };

  const annotateFocusSession = (sessionId: string, rating: FocusSession['concentrationRating'], notes: string) => {
    update((current) => ({
      ...current,
      focusHistory: current.focusHistory.map((session) => session.id === sessionId
        ? { ...session, concentrationRating: rating, notes }
        : session),
    }));
  };

  const toggleTask = (id: string) => update((current) => ({
    ...current,
    tasks: current.tasks.map((task) => task.id === id ? {
      ...task,
      completed: !task.completed,
      status: task.completed ? 'A fazer' : 'Concluído',
      updatedAt: Date.now(),
      history: [{ id: createId(), action: task.completed ? 'Tarefa reaberta' : 'Tarefa concluída', createdAt: Date.now() }, ...task.history],
    } : task),
  }));

  const moveTask = (id: string, direction: -1 | 1) => update((current) => {
    const dayTaskIndexes = current.dailyPriorityIds;
    const position = dayTaskIndexes.indexOf(id);
    const targetIndex = dayTaskIndexes[position + direction];
    if (position < 0 || targetIndex === undefined) return current;
    const dailyPriorityIds = [...dayTaskIndexes];
    [dailyPriorityIds[position], dailyPriorityIds[position + direction]] = [dailyPriorityIds[position + direction], dailyPriorityIds[position]];
    return { ...current, dailyPriorityIds };
  });

  const toggleSchedule = (id: string) => update((current) => ({
    ...current,
    schedule: id.startsWith('task-')
      ? current.schedule
      : current.schedule.map((item) => item.id === id ? { ...item, completed: !item.completed } : item),
    tasks: id.startsWith('task-')
      ? current.tasks.map((task) => task.id === id.slice(5) ? {
          ...task,
          completed: !task.completed,
          status: task.completed ? 'A fazer' : 'Concluído',
          updatedAt: Date.now(),
        } : task)
      : current.tasks,
  }));

  const startTaskFocus = (task: DashboardTask) => {
    if (data.activeFocus) {
      if (window.confirm('Já existe uma sessão em andamento. Interromper e trocar para esta tarefa?')) {
        finishFocus(false);
        setFocusInitialTaskId(task.id);
        setFocusInitialProjectId(task.projectId);
        navigateModule('Focus Mode');
      }
      return;
    }
    setFocusInitialTaskId(task.id);
    setFocusInitialProjectId(task.projectId);
    navigateModule('Focus Mode');
  };

  const startProjectFocus = (projectId: string) => {
    if (data.activeFocus && !window.confirm('Já existe uma sessão em andamento. Interromper e trocar para este projeto?')) return;
    if (data.activeFocus) finishFocus(false);
    setFocusInitialTaskId('');
    setFocusInitialProjectId(projectId);
    navigateModule('Focus Mode');
  };

  const addTask = () => {
    if (todayTasks.length >= 3) {
      notify('Você já definiu as três prioridades de hoje.');
      return;
    }
    setEditingTask(null);
    setDialog('task');
  };

  const handleAiAction = (action: string) => {
    setAiAction(action);
    if (action === 'Estou perdido') setDialog('recovery');
  };

  const beginOnboarding = () => {
    if (!onboardingMission.trim()) {
      notify('Defina uma missão principal para começar.');
      return;
    }
    const project: DashboardProject | null = onboardingProject.trim()
      ? {
          id: createId(),
          name: onboardingProject.trim(),
          description: '',
          objective: '',
          category: '',
          color: '#F59E0B',
          icon: 'folder',
          status: 'Ativo',
          priority: 'Média',
          startAt: '',
          dueAt: '',
          createdAt: Date.now(),
          archivedAt: '',
          phases: [],
          milestones: [],
          activity: [],
          files: [],
        }
      : null;
    const tasks = onboardingPriorities
      .map((title) => title.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((title) => ({
        id: createId(),
        title,
        projectId: project?.id || '',
        day: today,
        dependsOnId: '',
        description: '',
        category: '',
        tags: [],
        status: 'A fazer' as const,
        priority: 'Média' as const,
        startAt: '',
        estimatedMinutes: 25,
        actualMinutes: 0,
        dueAt: '',
        scheduledAt: '',
        recurrence: 'Não repetir',
        subtasks: [],
        notes: '',
        history: [],
        completed: false,
        archivedAt: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
    const dailyPriorityIds = tasks.map((task) => task.id);
    update((current) => ({
      ...current,
      profileName: onboardingName.trim(),
      focusGoalMinutes: Math.max(15, Number(onboardingGoal) || 120),
      mission: { title: onboardingMission.trim(), projectId: project?.id || '', dueAt: '', completed: false, day: today },
      tasks: [...current.tasks, ...tasks],
      dailyPriorityIds,
      projects: project ? [...current.projects, project] : current.projects,
      onboardingComplete: true,
    }));
    notify('Seu primeiro dia está pronto.');
  };

  const resetLocalData = () => {
    if (window.confirm('Isso apagará os dados do dashboard salvos neste navegador. Deseja continuar?')) {
      reset();
      navigateModule('Dashboard');
      notify('Dados locais redefinidos.');
    }
  };

  if (!loaded && !error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-[#A1A1AA]">
        <div className="flex items-center gap-3 text-sm"><LoaderCircle className="h-4 w-4 animate-spin text-[#F59E0B]" />Abrindo seu espaço de execução...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
        <section className="max-w-md rounded-2xl border border-red-500/20 bg-[#101010] p-6">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <h1 className="mt-4 text-lg font-semibold">Não foi possível carregar o dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{error}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/5">Tentar novamente</button>
            <button type="button" onClick={resetLocalData} className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10">Redefinir dados locais</button>
            <button type="button" onClick={onExit} className="rounded-lg px-3 py-2 text-xs text-[#A1A1AA] hover:text-white">Voltar ao site</button>
          </div>
        </section>
      </main>
    );
  }

  const activeTask = data.tasks.find((task) => task.id === data.activeFocus?.taskId);
  const layoutOffset = collapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]';

  if (activeModule === 'Focus Mode') {
    return (
      <>
        <FocusModePage
          tasks={data.tasks}
          projects={data.projects}
          dailyPriorityIds={data.dailyPriorityIds}
          activeFocus={data.activeFocus}
          focusHistory={data.focusHistory}
          initialTaskId={focusInitialTaskId}
          initialProjectId={focusInitialProjectId}
          onStart={startFocus}
          onPause={pauseFocus}
          onResume={resumeFocus}
          onFinish={finishFocus}
          onStartBreak={startBreak}
          onSkipBreak={() => finishFocus(true)}
          onAnnotate={annotateFocusSession}
          onNavigate={(module, projectId) => navigateModule(module, projectId)}
          onNotify={notify}
        />
        {toast && <div role="status" className="fixed bottom-5 right-5 z-[90] flex max-w-[calc(100vw-2.5rem)] items-center gap-2 rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-xs text-[#E4E4E7] shadow-2xl"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F59E0B]/10 text-[#FBBF24]"><Check className="h-3 w-3" /></span>{toast}</div>}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <DashboardSidebar
        activeModule={activeModule}
        collapsed={collapsed}
        mobileOpen={mobileMenuOpen}
        profileName={data.profileName}
        onSelect={(module) => {
          if (module === 'Focus Mode' && !data.activeFocus) {
            setFocusInitialTaskId('');
            setFocusInitialProjectId('');
          }
          navigateModule(module);
        }}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onExit={onExit}
      />

      <div className={`min-h-screen transition-[margin] duration-200 ${layoutOffset}`}>
        <DashboardHeader
          profileName={data.profileName}
          activeModule={activeModule}
          alertMessages={alerts}
          searchValue={search}
          onCaptureIdea={() => setDialog('idea')}
          onSearch={setSearch}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />

        <main className="mx-auto max-w-[1500px] px-4 pb-10 pt-6 sm:px-7 sm:pt-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#71717A]">Pare de planejar infinitamente. Comece a executar.</p>
              <p className="mt-1 text-[11px] text-[#52525B]">Este painel salva seus dados somente neste navegador — não há conta autenticada nem sincronização em nuvem.</p>
            </div>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.05] px-2.5 py-1 text-[10px] text-amber-200 sm:inline-flex">
              <ShieldAlert className="h-3 w-3" /> Modo local
            </span>
          </div>

          {activeModule === 'Dashboard' ? (
            <div className="space-y-5">
              {!data.onboardingComplete && (
                <section className="rounded-2xl border border-[#F59E0B]/20 bg-[#101010] p-5 sm:p-7">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/10 text-[#FBBF24]"><Sparkles className="h-4 w-4" /></span>
                    <div><p className="text-sm font-semibold text-white">Seu espaço de execução está pronto.</p><p className="mt-1 text-xs text-[#A1A1AA]">Vamos organizar seu primeiro dia? Seus dados não serão preenchidos com exemplos.</p></div>
                  </div>
                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <div className="space-y-4">
                      <label className="block text-xs font-medium text-[#D4D4D8]">1. Seu nome (opcional)<input maxLength={60} value={onboardingName} onChange={(event) => setOnboardingName(event.target.value)} placeholder="Como podemos te chamar?" className={`${inputClass} mt-1.5`} /></label>
                      <label className="block text-xs font-medium text-[#D4D4D8]">2. Sua missão principal<input maxLength={160} value={onboardingMission} onChange={(event) => setOnboardingMission(event.target.value)} placeholder="O que faria hoje valer a pena?" className={`${inputClass} mt-1.5`} /></label>
                      <label className="block text-xs font-medium text-[#D4D4D8]">3. Meta diária de foco (minutos)<input type="number" min="15" max="1440" value={onboardingGoal} onChange={(event) => setOnboardingGoal(event.target.value)} className={`${inputClass} mt-1.5`} /></label>
                    </div>
                    <div className="space-y-4">
                      <fieldset>
                        <legend className="text-xs font-medium text-[#D4D4D8]">4. Até três prioridades</legend>
                        <div className="mt-1.5 space-y-2">
                          {onboardingPriorities.map((value, index) => (
                            <input key={index} maxLength={140} value={value} onChange={(event) => setOnboardingPriorities((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Prioridade ${index + 1} (opcional)`} className={inputClass} />
                          ))}
                        </div>
                      </fieldset>
                      <label className="block text-xs font-medium text-[#D4D4D8]">Projeto inicial (opcional)<input maxLength={80} value={onboardingProject} onChange={(event) => setOnboardingProject(event.target.value)} placeholder="Nome do projeto" className={`${inputClass} mt-1.5`} /></label>
                    </div>
                  </div>
                  <button type="button" onClick={beginOnboarding} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#FBBF24]">
                    Começar meu dia <Check className="h-3.5 w-3.5" />
                  </button>
                </section>
              )}

              <MissionCard
                mission={data.mission}
                projectName={data.mission?.projectId ? projectName(data.mission.projectId) : undefined}
                onEdit={() => setDialog('mission')}
                onComplete={() => {
                  update((current) => current.mission ? { ...current, mission: { ...current.mission, completed: true } } : current);
                  notify('Missão concluída. Bom trabalho!');
                }}
              />

              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5">
                  <PrioritiesCard
                    tasks={todayTasks}
                    projects={data.projects}
                    search={search}
                    onToggle={toggleTask}
                    onEdit={(task) => { setEditingTask(task); setDialog('task'); }}
                    onMove={moveTask}
                    onDelete={(id) => {
                      const task = data.tasks.find((item) => item.id === id);
                      if (task) deleteTask(task);
                    }}
                    onAdd={addTask}
                  />
                  <NextActionCard task={recommendedTask} projectName={recommendedTask?.projectId ? projectName(recommendedTask.projectId) : undefined} onStart={startTaskFocus} onAdd={addTask} />
                  <ScheduleCard
                    schedule={todaySchedule}
                    onAdd={() => setDialog('schedule')}
                    onToggle={toggleSchedule}
                    onDelete={(id) => {
                      update((current) => ({ ...current, schedule: current.schedule.filter((item) => item.id !== id) }));
                      notify('Atividade removida da agenda.');
                    }}
                  />
                </div>

                <div className="space-y-5">
                  <ProgressCard tasks={todayTasks} focusMinutes={todayFocusMinutes} focusGoalMinutes={data.focusGoalMinutes} mission={data.mission} />
                  <FocusCard
                    activeFocus={data.activeFocus}
                    activeTask={activeTask}
                    focusMinutes={todayFocusMinutes}
                    focusGoalMinutes={data.focusGoalMinutes}
                    focusHistory={data.focusHistory}
                    onStart={() => { setFocusInitialTaskId(''); setFocusInitialProjectId(''); navigateModule('Focus Mode'); }}
                    onPause={pauseFocus}
                    onResume={resumeFocus}
                    onRest={startBreak}
                    onFinish={finishFocus}
                  />
                  <ProjectsCard
                    projects={data.projects.filter((project) => !project.archivedAt && project.status !== 'Concluído')}
                    tasks={data.tasks}
                    onAdd={() => navigateModule('Projetos')}
                    onOpen={() => navigateModule('Projetos')}
                  />
                  <DailyAiCard task={recommendedTask} action={aiAction} onChoose={handleAiAction} />
                  <AlertsCard messages={alerts} onDefineMission={() => setDialog('mission')} />
                </div>
              </div>
            </div>
          ) : activeModule === 'Tarefas' ? (
            <TaskManagerPage
              tasks={data.tasks}
              dailyPriorityIds={data.dailyPriorityIds}
              projects={data.projects}
              focusHistory={data.focusHistory}
              initialProjectId={taskProjectFilterId}
              onSave={saveManagedTask}
              onDelete={deleteTask}
              onUpdate={updateTaskRecord}
              onStartFocus={(task) => startTaskFocus(task)}
              onOpenProject={(id) => navigateModule('Projetos', id)}
              onToggleDailyPriority={toggleDailyPriority}
              onNotify={notify}
            />
          ) : activeModule === 'Projetos' ? (
            <ProjectManagerPage
              projects={data.projects}
              tasks={data.tasks}
              focusHistory={data.focusHistory}
              projectId={selectedProjectId}
              onNavigate={navigateModule}
              onSaveProject={saveProject}
              onDeleteProject={deleteProject}
              onUpdateProject={updateProjectRecord}
              onUpdateTask={updateTaskRecord}
              onNotify={notify}
              onStartFocus={startProjectFocus}
            />
          ) : activeModule === 'Cofre de ideias' ? (
            <section className="rounded-2xl border border-white/[0.08] bg-[#101010] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h1 className="text-lg font-semibold text-white">Cofre de ideias</h1><p className="mt-1 text-xs text-[#A1A1AA]">{data.ideas.length} ideia(s) capturada(s)</p></div>
                <button type="button" onClick={() => setDialog('idea')} className="rounded-lg bg-[#F59E0B] px-3 py-2 text-xs font-semibold text-black hover:bg-[#FBBF24]">+ Capturar ideia</button>
              </div>
              {data.ideas.length ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {data.ideas.map((idea) => (
                    <article key={idea.id} className={`rounded-xl border p-4 transition-colors ${newIdeaId === idea.id ? 'border-[#F59E0B]/30 bg-[#F59E0B]/[0.035]' : 'border-white/[0.07] bg-white/[0.02]'}`}>
                      <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-[#A1A1AA]">{idea.category}</span><button type="button" onClick={() => { update((current) => ({ ...current, ideas: current.ideas.filter((item) => item.id !== idea.id) })); notify('Ideia removida.'); }} className="text-[10px] text-[#71717A] hover:text-red-400">Excluir</button></div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#E4E4E7]">{idea.text}</p>
                      {idea.link && <a href={idea.link} target="_blank" rel="noreferrer" className="mt-3 block truncate text-xs text-[#FBBF24] underline decoration-[#F59E0B]/30 underline-offset-2">{idea.link}</a>}
                      {idea.attachmentName && idea.attachmentData && <a href={idea.attachmentData} download={idea.attachmentName} className="mt-3 block truncate text-xs text-[#FBBF24] underline decoration-[#F59E0B]/30 underline-offset-2">Baixar anexo: {idea.attachmentName}</a>}
                      <p className="mt-3 text-[10px] text-[#71717A]">{projectName(idea.projectId) || 'Sem projeto'} · {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(idea.createdAt))}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-white/10 p-10 text-center"><Lightbulb className="mx-auto h-6 w-6 text-[#52525B]" /><p className="mt-3 text-sm text-white">Seu cofre está vazio.</p><p className="mt-1 text-xs text-[#71717A]">Capture uma ideia para guardá-la sem interromper o que está fazendo.</p></div>
              )}
            </section>
          ) : activeModule === 'Configurações' ? (
            <section className="max-w-2xl rounded-2xl border border-white/[0.08] bg-[#101010] p-5 sm:p-6">
              <h1 className="text-lg font-semibold text-white">Configurações locais</h1>
              <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">Preferências salvas somente neste navegador. Elas não são associadas a uma conta autenticada.</p>
              <div className="mt-6 space-y-5">
                <label className="block text-xs font-medium text-[#D4D4D8]">Nome do perfil<input maxLength={60} value={data.profileName} onChange={(event) => update((current) => ({ ...current, profileName: event.target.value }))} placeholder="Como podemos te chamar?" className={`${inputClass} mt-1.5`} /></label>
                <label className="block text-xs font-medium text-[#D4D4D8]">Meta diária de foco (minutos)<input type="number" min="15" max="1440" value={data.focusGoalMinutes} onChange={(event) => update((current) => ({ ...current, focusGoalMinutes: Math.min(1440, Math.max(15, Number(event.target.value) || 15)) }))} className={`${inputClass} mt-1.5 max-w-xs`} /></label>
                <div className="border-t border-white/[0.07] pt-5">
                  <p className="text-xs font-medium text-white">Dados deste dispositivo</p>
                  <p className="mt-1 max-w-lg text-xs leading-5 text-[#71717A]">Não há autenticação, backup na nuvem ou isolamento entre usuários neste protótipo. Limpar os dados do navegador também remove este dashboard.</p>
                  <button type="button" onClick={resetLocalData} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 transition-colors hover:bg-red-500/10"><RotateCcw className="h-3.5 w-3.5" /> Redefinir dados locais</button>
                </div>
              </div>
            </section>
          ) : (
            <EmptyModule module={activeModule} onBack={() => navigateModule('Dashboard')} />
          )}
        </main>
      </div>

      {dialog === 'mission' && <MissionDialog mission={data.mission} projects={data.projects} onClose={() => setDialog(null)} onSave={saveMission} />}
      {dialog === 'task' && <TaskDialog task={editingTask} tasks={todayTasks} projects={data.projects} onClose={() => { setDialog(null); setEditingTask(null); }} onSave={saveTask} />}
      {dialog === 'schedule' && <ScheduleDialog onClose={() => setDialog(null)} onSave={saveSchedule} />}
      {dialog === 'idea' && <IdeaDialog projects={data.projects} onClose={() => setDialog(null)} onSave={saveIdea} />}
      {dialog === 'recovery' && <RecoveryDialog nextTask={recommendedTask} onClose={() => setDialog(null)} />}

      {toast && (
        <div role="status" className="fixed bottom-5 right-5 z-[90] flex max-w-[calc(100vw-2.5rem)] items-center gap-2 rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-xs text-[#E4E4E7] shadow-2xl">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F59E0B]/10 text-[#FBBF24]"><Check className="h-3 w-3" /></span>{toast}
        </div>
      )}
      <span className="sr-only" aria-live="polite">{data.activeFocus ? `Timer em andamento. ${Math.floor(elapsedFocusMs / 60000)} minutos decorridos.` : ''}</span>
    </div>
  );
};
