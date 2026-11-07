import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Bell, BellOff, Check, CircleHelp, Clock3, Focus, Lightbulb,
  Maximize2, Minimize2, Pause, Play, Search, Settings2, Volume2, VolumeX,
} from 'lucide-react';
import { ambientAudio, type AmbientKind } from '../../audio/ambientAudio';
import { localDateKey } from './dashboardService';
import type {
  ActiveFocusSession, DashboardProject, DashboardTask, FocusSession, FocusSessionConfig,
} from './types';

type TaskFilter = 'Todas' | 'Hoje' | 'Prioridades' | 'Atrasadas' | 'Em andamento';
type HistoryFilter = 'Hoje' | 'Últimos 7 dias' | 'Últimos 30 dias' | 'Personalizado' | 'Tudo';
type Rating = 'Excelente' | 'Boa' | 'Regular' | 'Difícil';

const card = 'rounded-2xl border border-white/[0.08] bg-[#101010]';
const field = 'w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#F59E0B]/50';
const modes = ['Pomodoro', 'Deep Focus', 'Sprint', 'Personalizado', 'Cronômetro'] as const;
const ratings: Rating[] = ['Excelente', 'Boa', 'Regular', 'Difícil'];
const editableSelector = 'input, textarea, select, [contenteditable="true"]';

interface FocusModePageProps {
  tasks: DashboardTask[];
  projects: DashboardProject[];
  dailyPriorityIds: string[];
  activeFocus: ActiveFocusSession | null;
  focusHistory: FocusSession[];
  initialTaskId?: string;
  initialProjectId?: string;
  isCaptureOpen?: boolean;
  onStart: (config: FocusSessionConfig) => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: (completed: boolean) => void;
  onStartBreak: (config: FocusSessionConfig, parentSessionId?: string) => void;
  onSkipBreak: () => void;
  onAnnotate: (sessionId: string, rating: Rating | null, notes: string) => void;
  onNavigate: (module: 'Dashboard' | 'Tarefas' | 'Projetos' | 'Cofre de ideias', projectId?: string) => void;
  onCaptureIdea: () => void;
  onNotify: (message: string) => void;
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(editableSelector));
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function durationLabel(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  if (safe < 60) return `${safe} s`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const secondsRemainder = safe % 60;
  if (hours) return `${hours}h ${remainder}m${secondsRemainder ? ` ${secondsRemainder}s` : ''}`;
  return `${minutes} min${secondsRemainder ? ` ${secondsRemainder}s` : ''}`;
}

function sessionSeconds(session: FocusSession): number {
  return session.actualFocusSeconds ?? session.durationMinutes * 60;
}

function localDay(timestamp: number): string {
  return localDateKey(new Date(timestamp));
}

function loadAudioSettings(): { settings: { enabled: boolean; kind: AmbientKind; volume: number; browserNotifications: boolean }; error: string } {
  try {
    const value = window.localStorage.getItem('umbra-focus-audio-v1');
    if (value) {
      const parsed = JSON.parse(value) as { kind?: string; volume?: number; browserNotifications?: boolean };
      return { settings: {
        enabled: ambientAudio.isPlaying,
        kind: parsed.kind === 'brown' ? 'brown' : 'white',
        volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 0.12,
        browserNotifications: parsed.browserNotifications === true,
      }, error: '' };
    }
  } catch {
    return { settings: { enabled: false, kind: 'white', volume: 0.12, browserNotifications: false }, error: 'Não foi possível ler as preferências de áudio salvas.' };
  }
  return { settings: { enabled: false, kind: 'white', volume: 0.12, browserNotifications: false }, error: '' };
}

export const FocusModePage: React.FC<FocusModePageProps> = ({
  tasks, projects, dailyPriorityIds, activeFocus, focusHistory, initialTaskId, initialProjectId, isCaptureOpen = false,
  onStart, onPause, onResume, onFinish, onStartBreak, onSkipBreak, onAnnotate, onNavigate, onCaptureIdea, onNotify,
}) => {
  const [now, setNow] = useState(Date.now());
  const [mode, setMode] = useState<(typeof modes)[number]>('Pomodoro');
  const [customFocusMinutes, setCustomFocusMinutes] = useState(30);
  const [customBreakMinutes, setCustomBreakMinutes] = useState(5);
  const [cycles, setCycles] = useState(4);
  const [autoBreak, setAutoBreak] = useState(true);
  const [autoNextCycle, setAutoNextCycle] = useState(false);
  const [taskId, setTaskId] = useState(initialTaskId || '');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('Todas');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('Últimos 7 dias');
  const [historyProject, setHistoryProject] = useState('');
  const [historyTask, setHistoryTask] = useState('');
  const [historyMode, setHistoryMode] = useState('');
  const [minimal, setMinimal] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [summary, setSummary] = useState<FocusSession | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [initialAudio] = useState(loadAudioSettings);
  const [audioSettings, setAudioSettings] = useState(initialAudio.settings);
  const [audioError, setAudioError] = useState(initialAudio.error);
  const [customHistoryStart, setCustomHistoryStart] = useState(localDateKey(new Date(now - 6 * 86_400_000)));
  const [customHistoryEnd, setCustomHistoryEnd] = useState(localDateKey());
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoFinishedId = useRef('');
  const lastConfigRef = useRef<FocusSessionConfig | null>(null);
  const active = activeFocus;
  const isBreak = active?.phase === 'break' || active?.mode === 'Descanso';
  const elapsedMs = active
    ? active.elapsedBeforePauseMs + (active.startedAt ? now - active.startedAt : 0)
    : 0;
  const durationSeconds = active?.durationMinutes ? active.durationMinutes * 60 : null;
  const remainingSeconds = durationSeconds === null ? null : Math.max(0, durationSeconds - Math.floor(elapsedMs / 1000));
  const timerValue = remainingSeconds === null ? Math.floor(elapsedMs / 1000) : remainingSeconds;
  const progress = durationSeconds ? Math.min(1, elapsedMs / (durationSeconds * 1000)) : 0;
  const selectedTask = tasks.find((task) => task.id === (active?.taskId || taskId));
  const selectedProjectId = active?.projectId || selectedTask?.projectId || projectId;
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const currentConfig: FocusSessionConfig = {
    taskId: active?.taskId ?? (taskId || null),
    projectId: active?.projectId ?? (selectedTask?.projectId || projectId || null),
    mode: active?.focusMode || (active?.mode === 'Descanso' ? mode : active?.mode || mode),
    durationMinutes: active ? active.focusDurationMinutes ?? (active.mode === 'Descanso' ? null : active.durationMinutes) : (mode === 'Cronômetro' ? null : mode === 'Pomodoro' ? 25 : mode === 'Deep Focus' ? 50 : mode === 'Sprint' ? 15 : customFocusMinutes),
    breakDurationMinutes: active?.breakDurationMinutes ?? (mode === 'Deep Focus' ? 10 : mode === 'Sprint' ? 3 : mode === 'Personalizado' ? customBreakMinutes : 5),
    cycles: active?.totalCycles ?? (mode === 'Personalizado' ? cycles : 1),
    autoBreak: active?.autoBreak ?? autoBreak,
    autoNextCycle: active?.autoNextCycle ?? autoNextCycle,
  };
  const activeSessionCount = focusHistory.filter((item) => item.status !== 'Interrompida').length;
  const totalFocusedSeconds = focusHistory.reduce((total, item) => total + sessionSeconds(item), 0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!active && initialTaskId) setTaskId(initialTaskId);
    if (!active && initialProjectId) setProjectId(initialProjectId);
  }, [initialTaskId, initialProjectId, active]);

  useEffect(() => {
    if (active && !isBreak) lastConfigRef.current = currentConfig;
  }, [active, isBreak, currentConfig]);

  useEffect(() => {
    if (!active || remainingSeconds === null || remainingSeconds > 0) return;
    if (autoFinishedId.current === (active.id || String(active.sessionStartedAt))) return;
    autoFinishedId.current = active.id || String(active.sessionStartedAt);
    if (isBreak) {
      onSkipBreak();
      onNotify('Descanso finalizado.');
      return;
    }
    const canAutoBreak = active.autoBreak && (active.cycleIndex || 1) <= (active.totalCycles || 1);
    if (canAutoBreak) {
      onStartBreak(currentConfig, makeSession(active, elapsedMs, true, now).id);
      onNotify('Ciclo concluído. Hora de respirar.');
      if (audioSettings.browserNotifications) notifyBrowser('Ciclo de foco concluído', 'O descanso está começando.');
      if (alarmEnabled) playAlertTone();
      return;
    }
    const record = makeSession(active, elapsedMs, true, now);
    setSummary(record);
    setRating(null);
    setSessionNotes('');
    onFinish(true);
    onNotify('Sessão concluída. Bom trabalho!');
    if (audioSettings.browserNotifications) notifyBrowser('Foco concluído', 'Sua sessão de concentração terminou.');
    if (alarmEnabled) playAlertTone();
  }, [active, remainingSeconds, isBreak, currentConfig, elapsedMs, now, onFinish, onSkipBreak, onStartBreak, onNotify, alarmEnabled, audioSettings.browserNotifications]);

  useEffect(() => {
    try {
      window.localStorage.setItem('umbra-focus-audio-v1', JSON.stringify({
        kind: audioSettings.kind,
        volume: audioSettings.volume,
        browserNotifications: audioSettings.browserNotifications,
      }));
    } catch {
      setAudioError('Não foi possível salvar as preferências de áudio.');
    }
  }, [audioSettings.kind, audioSettings.volume, audioSettings.browserNotifications]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isCaptureOpen || isEditable(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (!active) startSession();
        else if (active.startedAt) onPause();
        else onResume();
      } else if (event.key.toLowerCase() === 'f') {
        void toggleFullscreen();
      } else if (event.key.toLowerCase() === 'm') {
        void toggleAudio();
      } else if (event.key.toLowerCase() === 'n' && !active) {
        setTaskId('');
        setProjectId('');
        setSummary(null);
        onNotify('Nova sessão pronta.');
      } else if (event.key.toLowerCase() === 'r' && active && window.confirm('Interromper a sessão atual? O tempo já focado será registrado.')) {
        finishSession(false);
      } else if (event.key === 'Escape' && document.fullscreenElement) {
        void document.exitFullscreen();
      } else if (event.key === '?') {
        setHelpOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    const onFullscreenChange = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (task.archivedAt || task.status === 'Concluído') return false;
    if (projectId && task.projectId !== projectId) return false;
    if (taskSearch && !`${task.title} ${task.description}`.toLowerCase().includes(taskSearch.toLowerCase())) return false;
    if (taskFilter === 'Hoje' && task.day !== localDateKey() && task.dueAt !== localDateKey()) return false;
    if (taskFilter === 'Prioridades' && !dailyPriorityIds.includes(task.id)) return false;
    if (taskFilter === 'Atrasadas' && !(task.dueAt && task.dueAt < localDateKey())) return false;
    if (taskFilter === 'Em andamento' && task.status !== 'Em andamento') return false;
    return true;
  }), [tasks, projectId, taskSearch, taskFilter, dailyPriorityIds]);

  const filteredHistory = useMemo(() => {
    const cutoff = historyFilter === 'Hoje'
      ? new Date(`${localDateKey()}T00:00:00`).getTime()
      : historyFilter === 'Últimos 7 dias' ? now - 7 * 86_400_000
      : historyFilter === 'Últimos 30 dias' ? now - 30 * 86_400_000
      : historyFilter === 'Personalizado' ? new Date(`${customHistoryStart}T00:00:00`).getTime() : 0;
    const upperBound = historyFilter === 'Personalizado' ? new Date(`${customHistoryEnd}T23:59:59`).getTime() : now;
    return focusHistory.filter((session) => session.startedAt >= cutoff && session.startedAt <= upperBound
      && (!historyProject || session.projectId === historyProject)
      && (!historyTask || session.taskId === historyTask)
      && (!historyMode || session.mode === historyMode));
  }, [focusHistory, historyFilter, historyProject, historyTask, historyMode, customHistoryStart, customHistoryEnd, now]);
  const todaySeconds = focusHistory.filter((item) => localDay(item.startedAt) === localDateKey()).reduce((sum, item) => sum + sessionSeconds(item), 0);
  const weekSeconds = focusHistory.filter((item) => item.startedAt >= now - 7 * 86_400_000).reduce((sum, item) => sum + sessionSeconds(item), 0);
  const monthSeconds = focusHistory.filter((item) => item.startedAt >= now - 30 * 86_400_000).reduce((sum, item) => sum + sessionSeconds(item), 0);
  const bestCycleSequence = Math.max(0, ...focusHistory.filter((item) => item.status !== 'Interrompida').map((item) => item.cycleIndex || 1));

  const startSession = () => {
    if (active) return;
    autoFinishedId.current = '';
    onStart(currentConfig);
    onNotify('Sessão de foco iniciada.');
  };

  const finishSession = (completed: boolean) => {
    if (!active) return;
    if (isBreak) {
      onSkipBreak();
      onNotify('Descanso encerrado.');
      return;
    }
    const record = makeSession(active, elapsedMs, completed, Date.now());
    setSummary(completed ? record : null);
    setRating(null);
    setSessionNotes('');
    onFinish(completed);
    onNotify(completed ? 'Sessão finalizada e registrada.' : 'Sessão interrompida e registrada.');
    if (completed && audioSettings.browserNotifications) notifyBrowser('Sessão de foco concluída', 'Sua sessão foi registrada.');
    if (completed && alarmEnabled) playAlertTone();
  };

  const beginBreak = () => {
    if (active && !isBreak) {
      const ended = makeSession(active, elapsedMs, true, Date.now());
      setSummary(ended);
      setRating(null);
      setSessionNotes('');
      onFinish(true);
      return;
    }
    onStartBreak(lastConfigRef.current || currentConfig, summary?.id);
    onNotify('Hora de respirar.');
  };

  const restartSession = () => {
    if (active && !window.confirm('Interromper esta sessão e iniciar outra? O tempo já focado será registrado.')) return;
    if (active) onFinish(false);
    setSummary(null);
    autoFinishedId.current = '';
    onStart(currentConfig);
    onNotify('Nova sessão iniciada.');
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch {
      onNotify('Tela cheia não está disponível neste navegador.');
    }
  };

  const toggleAudio = async () => {
    setAudioError('');
    if (audioSettings.enabled) {
      ambientAudio.stop();
      setAudioSettings((current) => ({ ...current, enabled: false }));
      return;
    }
    try {
      await ambientAudio.play(audioSettings.kind, audioSettings.volume);
      setAudioSettings((current) => ({ ...current, enabled: true }));
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : 'Não foi possível reproduzir o áudio ambiente.');
    }
  };

  const changeAudio = async (patch: Partial<typeof audioSettings>) => {
    const next = { ...audioSettings, ...patch };
    setAudioSettings(next);
    if (!next.enabled) return;
    try {
      await ambientAudio.play(next.kind, next.volume);
      setAudioError('');
    } catch (error) {
      setAudioSettings((current) => ({ ...current, enabled: false }));
      setAudioError(error instanceof Error ? error.message : 'Não foi possível reproduzir o áudio ambiente.');
    }
  };

  const enableBrowserNotifications = async (enabled: boolean) => {
    if (!enabled) {
      setAudioSettings((current) => ({ ...current, browserNotifications: false }));
      return;
    }
    if (!('Notification' in window)) {
      setAudioError('Este navegador não oferece suporte a notificações.');
      return;
    }
    try {
      const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
      if (permission === 'granted') setAudioSettings((current) => ({ ...current, browserNotifications: true }));
      else setAudioError('Permissão de notificação não concedida.');
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : 'Não foi possível solicitar permissão para notificações.');
    }
  };

  const commitSummary = () => {
    if (summary) onAnnotate(summary.id, rating, sessionNotes.trim());
    setSummary(null);
    onNotify('Resumo da sessão salvo.');
  };

  const ringCircumference = 2 * Math.PI * 146;
  const startedLabel = active?.sessionStartedAt
    ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(active.sessionStartedAt))
    : null;

  return (
    <div ref={rootRef} className="min-h-screen bg-[#080808] text-white selection:bg-[#F59E0B]/30">
      {!minimal && (
        <header className="flex min-h-[72px] items-center justify-between border-b border-white/[0.07] px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => onNavigate('Dashboard')} aria-label="Voltar ao Dashboard" className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
            <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B] shadow-[0_0_12px_#F59E0B]" />
            <span className="hidden font-mono text-xs tracking-wider sm:block">UMBRA <span className="text-[#A1A1AA]">DAILY OS</span></span>
            <span className="h-4 w-px bg-white/10" />
            <div><h1 className="text-sm font-semibold">Focus Mode</h1><p className="mt-0.5 text-[9px] text-[#52525B]">Sessões salvas neste navegador</p></div>
            {active && <span className="flex items-center gap-1.5 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] px-2.5 py-1 text-[10px] text-[#FBBF24]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F59E0B]" />Sessão ativa</span>}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onCaptureIdea} className="inline-flex items-center gap-1.5 rounded-lg border border-[#F59E0B]/20 px-2.5 py-2 text-[10px] text-[#FBBF24] hover:bg-[#F59E0B]/[0.06] sm:text-xs"><Lightbulb className="h-3.5 w-3.5" />Capturar ideia</button>
            <button type="button" onClick={() => setHistoryOpen((value) => !value)} className={`rounded-lg px-3 py-2 text-xs ${historyOpen ? 'bg-white/10 text-white' : 'text-[#A1A1AA] hover:text-white'}`}>Histórico</button>
            <button type="button" onClick={() => setSettingsOpen((value) => !value)} aria-label="Configurações do Focus Mode" className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-white"><Settings2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setMinimal(true)} aria-label="Ativar modo minimalista" className="hidden rounded-lg px-3 py-2 text-xs text-[#A1A1AA] hover:text-white sm:block">Minimalista</button>
          </div>
        </header>
      )}

      {minimal && <div className="fixed right-4 top-4 z-20 flex gap-2"><button type="button" onClick={onCaptureIdea} className="rounded-lg border border-[#F59E0B]/20 bg-[#101010] px-3 py-2 text-xs text-[#FBBF24]"><Lightbulb className="inline h-3.5 w-3.5" /> <span className="ml-1">Capturar ideia</span></button><button type="button" onClick={() => setMinimal(false)} className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-xs text-[#A1A1AA] hover:text-white">Sair do modo minimalista</button></div>}

      <main className={`mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-7 sm:py-8 ${!minimal && !active ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : 'max-w-4xl'}`}>
        {!active && !minimal && (
          <section className={`${card} p-4 sm:p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-sm font-semibold">Prepare sua sessão</h2><p className="mt-1 text-xs text-[#71717A]">Escolha um modo e associe uma tarefa existente, se quiser.</p></div>
              <button type="button" onClick={() => onNavigate('Tarefas')} className="text-xs text-[#FBBF24] hover:text-white">Gerenciar tarefas</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {modes.map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-xl border p-3 text-left transition-colors ${mode === item ? 'border-[#F59E0B]/40 bg-[#F59E0B]/[0.08] text-[#FBBF24]' : 'border-white/[0.08] bg-[#151515] text-[#D4D4D8] hover:border-white/20'}`}><span className="block text-xs font-medium">{item}</span><span className="mt-1 block text-[10px] text-[#71717A]">{item === 'Pomodoro' ? '25 foco · 5 pausa' : item === 'Deep Focus' ? '50 foco · 10 pausa' : item === 'Sprint' ? '15 foco · 3 pausa' : item === 'Personalizado' ? 'Defina ciclos e duração' : 'Sem limite de tempo'}</span></button>)}
            </div>
            {mode === 'Personalizado' && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-[11px] text-[#A1A1AA]">Foco (minutos)<input type="number" min="1" max="240" value={customFocusMinutes} onChange={(event) => setCustomFocusMinutes(Math.max(1, Number(event.target.value)))} className={`${field} mt-1.5`} /></label><label className="text-[11px] text-[#A1A1AA]">Descanso (minutos)<input type="number" min="0" max="60" value={customBreakMinutes} onChange={(event) => setCustomBreakMinutes(Math.max(0, Number(event.target.value)))} className={`${field} mt-1.5`} /></label><label className="text-[11px] text-[#A1A1AA]">Quantidade de ciclos<input type="number" min="1" max="12" value={cycles} onChange={(event) => setCycles(Math.max(1, Number(event.target.value)))} className={`${field} mt-1.5`} /></label></div>}
            {(mode === 'Personalizado' || mode === 'Sprint') && <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-[#A1A1AA]"><label className="flex items-center gap-2"><input type="checkbox" checked={autoBreak} onChange={(event) => setAutoBreak(event.target.checked)} />Iniciar descanso automaticamente</label><label className="flex items-center gap-2"><input type="checkbox" checked={autoNextCycle} onChange={(event) => setAutoNextCycle(event.target.checked)} />Iniciar próximo ciclo automaticamente</label></div>}
            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xs font-semibold text-white">Escolha uma tarefa</h3>{selectedProject && <button type="button" onClick={() => setProjectId('')} className="text-[10px] text-[#A1A1AA] hover:text-white">Projeto: {selectedProject.name} ×</button>}</div>
              <label className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0A0A0A] px-3 py-2"><Search className="h-4 w-4 text-[#71717A]" /><input value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} placeholder="Buscar tarefas..." className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#52525B]" /></label>
              <div className="mt-2 flex flex-wrap gap-1">{(['Todas', 'Hoje', 'Prioridades', 'Atrasadas', 'Em andamento'] as TaskFilter[]).map((filter) => <button key={filter} type="button" onClick={() => setTaskFilter(filter)} className={`rounded-md px-2.5 py-1.5 text-[10px] ${taskFilter === filter ? 'bg-[#F59E0B]/10 text-[#FBBF24]' : 'text-[#71717A] hover:text-white'}`}>{filter}</button>)}</div>
              {!initialProjectId && <select aria-label="Filtrar tarefas por projeto" value={projectId} onChange={(event) => setProjectId(event.target.value)} className={`${field} mt-2 py-2 text-xs`}><option value="">Todos os projetos</option>{projects.filter((project) => !project.archivedAt).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>}
              <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                <button type="button" onClick={() => setTaskId('')} className={`w-full rounded-lg border px-3 py-2.5 text-left text-xs ${!taskId ? 'border-[#F59E0B]/30 bg-[#F59E0B]/[0.05] text-[#FBBF24]' : 'border-white/[0.06] text-[#A1A1AA]'}`}>Foco livre — sem tarefa associada</button>
                {filteredTasks.map((task) => {
                  const project = projects.find((item) => item.id === task.projectId);
                  return <button key={task.id} type="button" onClick={() => { setTaskId(task.id); setProjectId(task.projectId); }} className={`w-full rounded-lg border px-3 py-2.5 text-left ${taskId === task.id ? 'border-[#F59E0B]/30 bg-[#F59E0B]/[0.05]' : 'border-white/[0.06] bg-[#151515] hover:border-white/15'}`}><span className="flex items-center justify-between gap-2"><span className="truncate text-xs text-white">{task.title}</span><span className="shrink-0 text-[10px] text-[#FBBF24]">{task.priority}</span></span><span className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-[#71717A]"><span>{project?.name || 'Sem projeto'}</span><span>{task.status}</span><span>{task.dueAt ? `Prazo ${task.dueAt}` : 'Sem prazo'}</span><span>{task.estimatedMinutes} min estimados</span></span></button>;
                })}
                {!filteredTasks.length && <p className="py-4 text-center text-xs text-[#71717A]">Nenhuma tarefa corresponde a esse filtro.</p>}
              </div>
            </div>
          </section>
        )}

        <section className={`relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden rounded-3xl ${minimal ? 'min-h-screen border-0 bg-transparent' : `${card} py-10 sm:py-14`}`}>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F59E0B]/[0.035] blur-[80px]" />
          <div className="relative z-10 flex w-full max-w-[620px] flex-col items-center px-4 text-center">
            {!minimal && <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F59E0B]"><Focus className="h-3.5 w-3.5" />{isBreak ? 'Recuperação' : 'Focus Mode'}</p>}
            <div className="relative mt-6 flex h-[min(70vw,340px)] w-[min(70vw,340px)] items-center justify-center sm:mt-8">
              <svg viewBox="0 0 320 320" className="absolute inset-0 h-full w-full -rotate-90" aria-label="Progresso da sessão">
                <circle cx="160" cy="160" r="146" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
                <circle cx="160" cy="160" r="146" fill="none" stroke={isBreak ? '#A1A1AA' : '#F59E0B'} strokeWidth="3" strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringCircumference * (1 - (isBreak ? progress : progress))} className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none" />
              </svg>
              <div className="relative">
                <p className="font-mono text-[clamp(3.2rem,13vw,6.5rem)] font-light leading-none tracking-[-0.06em] tabular-nums text-white" aria-live="off">{formatClock(timerValue)}</p>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A1A1AA]">{isBreak ? 'DESCANSO' : active?.mode || (mode === 'Cronômetro' ? 'FOCO LIVRE' : 'FOCO PROFUNDO')}</p>
              </div>
            </div>
            <h2 className="mt-2 max-w-xl text-lg font-medium text-white sm:text-xl">{isBreak ? 'Você merece uma pausa.' : selectedTask?.title || (active ? 'Sessão de concentração' : 'Prepare-se para começar.')}</h2>
            <p className="mt-2 text-xs text-[#71717A]">{isBreak ? 'Levante-se · Beba água · Alongue-se · Descanse os olhos' : active ? active.startedAt ? 'Você está em uma sessão de concentração.' : 'Sessão pausada.' : 'Escolha o que merece sua atenção agora.'}</p>
            {!minimal && (selectedProject || startedLabel || (active && (active.totalCycles || 0) > 1)) && <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] text-[#71717A]">{selectedProject && <button type="button" onClick={() => onNavigate('Projetos', selectedProject.id)} className="hover:text-[#FBBF24]">{selectedProject.name}</button>}{startedLabel && <span>Iniciada às {startedLabel}</span>}{active && (active.totalCycles || 0) > 1 && <span>Ciclo {active.cycleIndex || 1} de {active.totalCycles}</span>}</div>}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
              {!active ? <button type="button" onClick={startSession} className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#FBBF24] active:scale-[0.98]"><Play className="h-4 w-4 fill-current" />Iniciar foco</button>
                : isBreak ? <><button type="button" onClick={onSkipBreak} className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-3 text-sm font-semibold text-black hover:bg-[#FBBF24]"><Play className="h-4 w-4 fill-current" />{active.autoNextCycle && (active.cycleIndex || 1) < (active.totalCycles || 1) ? 'Próximo ciclo' : 'Encerrar descanso'}</button><button type="button" onClick={() => { onSkipBreak(); onNotify('Descanso pulado.'); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#A1A1AA] hover:text-white">Pular descanso</button></>
                : <>{active.startedAt ? <button type="button" onClick={() => { onPause(); onNotify('Sessão pausada.'); }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-white hover:bg-white/5"><Pause className="h-4 w-4" />Pausar</button> : <button type="button" onClick={() => { onResume(); onNotify('Sessão retomada.'); }} className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-3 text-sm font-semibold text-black hover:bg-[#FBBF24]"><Play className="h-4 w-4 fill-current" />Retomar</button>}<button type="button" onClick={() => finishSession(true)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300 hover:bg-emerald-500/10"><Check className="h-4 w-4" />Finalizar</button><button type="button" onClick={() => finishSession(false)} className="rounded-xl px-3 py-3 text-sm text-[#71717A] hover:text-red-300">Interromper</button>{!isBreak && <button type="button" onClick={beginBreak} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#A1A1AA] hover:text-white">Iniciar descanso</button>}</>}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={() => void toggleFullscreen()} aria-label={fullScreen ? 'Sair da tela cheia' : 'Ativar tela cheia'} className="rounded-lg p-2 text-[#52525B] hover:bg-white/5 hover:text-white">{fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
              <button type="button" onClick={() => setMinimal((value) => !value)} className="rounded-lg px-2.5 py-2 text-[10px] text-[#52525B] hover:text-white">{minimal ? 'Sair do mínimo' : 'Modo minimalista'}</button>
              <button type="button" onClick={() => void toggleAudio()} aria-label={audioSettings.enabled ? 'Desativar áudio ambiente' : 'Ativar áudio ambiente'} className={`rounded-lg p-2 ${audioSettings.enabled ? 'text-[#FBBF24]' : 'text-[#52525B] hover:text-white'}`}>{audioSettings.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
              <button type="button" onClick={() => setHelpOpen(true)} aria-label="Ajuda e atalhos de teclado" className="rounded-lg p-2 text-[#52525B] hover:text-white"><CircleHelp className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        {!minimal && !active && (
          <aside className="space-y-4">
            <section className={`${card} p-5`}><div className="flex items-center justify-between"><h2 className="text-xs font-semibold text-white">Seu ritmo</h2><Clock3 className="h-4 w-4 text-[#F59E0B]" /></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/[0.03] p-3"><p className="text-[10px] text-[#71717A]">Tempo focado</p><p className="mt-1 text-lg font-semibold text-white">{durationLabel(totalFocusedSeconds)}</p></div><div className="rounded-xl bg-white/[0.03] p-3"><p className="text-[10px] text-[#71717A]">Sessões</p><p className="mt-1 text-lg font-semibold text-white">{activeSessionCount}</p></div></div><p className="mt-3 text-[10px] text-[#71717A]">Tempo baseado nas sessões registradas neste navegador.</p></section>
            <section className={`${card} p-5`}><h2 className="text-xs font-semibold text-white">Áudio ambiente</h2><p className="mt-1 text-[10px] text-[#71717A]">Os sons são gerados no navegador; áudio começa somente após seu clique.</p><div className="mt-3 flex items-center gap-2"><select value={audioSettings.kind} onChange={(event) => void changeAudio({ kind: event.target.value as AmbientKind })} className={`${field} py-2 text-xs`}><option value="white">Ruído branco</option><option value="brown">Ruído marrom</option></select><button type="button" onClick={() => void toggleAudio()} className="rounded-lg border border-white/10 p-2.5 text-[#A1A1AA] hover:text-white">{audioSettings.enabled ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button></div><label className="mt-3 block text-[10px] text-[#A1A1AA]">Volume<input type="range" min="0" max="0.35" step="0.01" value={audioSettings.volume} onChange={(event) => void changeAudio({ volume: Number(event.target.value) })} className="mt-2 w-full accent-[#F59E0B]" /></label><p className="mt-2 text-[10px] text-[#52525B]">Chuva, floresta e sons espaciais não estão disponíveis: este projeto não inclui arquivos licenciados para esses ambientes.</p>{audioError && <p role="alert" className="mt-2 text-[10px] text-red-300">{audioError}</p>}</section>
            <section className={`${card} p-5`}><div className="flex items-center justify-between gap-2"><div><h2 className="text-xs font-semibold text-white">Alertas</h2><p className="mt-1 text-[10px] text-[#71717A]">Permissão solicitada somente quando você ativar.</p></div><Bell className="h-4 w-4 text-[#71717A]" /></div><label className="mt-3 flex items-center gap-2 text-[11px] text-[#A1A1AA]"><input type="checkbox" checked={audioSettings.browserNotifications} onChange={(event) => void enableBrowserNotifications(event.target.checked)} />Notificações do navegador</label><label className="mt-2 flex items-center gap-2 text-[11px] text-[#A1A1AA]"><input type="checkbox" checked={alarmEnabled} onChange={(event) => setAlarmEnabled(event.target.checked)} />Alertar quando o ciclo terminar</label><p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#52525B]"><BellOff className="h-3 w-3" />Alertas dependem do navegador e do sistema operacional.</p></section>
            <button type="button" onClick={() => setHistoryOpen(true)} className={`${card} flex w-full items-center justify-between p-4 text-left text-xs text-[#D4D4D8] hover:border-[#F59E0B]/20`}>Meu histórico de foco <span className="text-[#FBBF24]">Ver tudo →</span></button>
          </aside>
        )}
      </main>

      {settingsOpen && <Panel title="Configurações do Focus Mode" onClose={() => setSettingsOpen(false)}><p className="text-xs text-[#A1A1AA]">Preferências de ciclos e áudio ficam salvas localmente. A sessão ativa continua sendo reconstruída por timestamps, mesmo após recarregar a página.</p><label className="mt-4 flex items-center gap-2 text-xs text-[#D4D4D8]"><input type="checkbox" checked={autoBreak} onChange={(event) => setAutoBreak(event.target.checked)} />Iniciar descanso automaticamente</label><label className="mt-3 flex items-center gap-2 text-xs text-[#D4D4D8]"><input type="checkbox" checked={autoNextCycle} onChange={(event) => setAutoNextCycle(event.target.checked)} />Iniciar próximo ciclo automaticamente</label></Panel>}

      {historyOpen && <Panel title="Meu histórico de foco" onClose={() => setHistoryOpen(false)} wide>      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value as HistoryFilter)} className={`${field} py-2 text-xs`}>{(['Hoje', 'Últimos 7 dias', 'Últimos 30 dias', 'Personalizado', 'Tudo'] as HistoryFilter[]).map((value) => <option key={value}>{value}</option>)}</select><select value={historyProject} onChange={(event) => setHistoryProject(event.target.value)} className={`${field} py-2 text-xs`}><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><select value={historyTask} onChange={(event) => setHistoryTask(event.target.value)} className={`${field} py-2 text-xs`}><option value="">Todas as tarefas</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select><select value={historyMode} onChange={(event) => setHistoryMode(event.target.value)} className={`${field} py-2 text-xs`}><option value="">Todos os modos</option>{modes.map((value) => <option key={value}>{value}</option>)}</select></div>{historyFilter === 'Personalizado' && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-[10px] text-[#A1A1AA]">De<input type="date" value={customHistoryStart} onChange={(event) => setCustomHistoryStart(event.target.value)} className={`${field} mt-1 py-2 text-xs`} /></label><label className="text-[10px] text-[#A1A1AA]">Até<input type="date" value={customHistoryEnd} onChange={(event) => setCustomHistoryEnd(event.target.value)} className={`${field} mt-1 py-2 text-xs`} /></label></div>}<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat label="Sessões" value={String(filteredHistory.length)} /><Stat label="Tempo total" value={durationLabel(filteredHistory.reduce((sum, item) => sum + sessionSeconds(item), 0))} /><Stat label="Média por sessão" value={durationLabel(filteredHistory.length ? Math.floor(filteredHistory.reduce((sum, item) => sum + sessionSeconds(item), 0) / filteredHistory.length) : 0)} /><Stat label="Concluídas" value={String(filteredHistory.filter((item) => item.status !== 'Interrompida').length)} /><Stat label="Interrompidas" value={String(filteredHistory.filter((item) => item.status === 'Interrompida').length)} /><Stat label="Foco hoje" value={durationLabel(todaySeconds)} /><Stat label="Foco na semana" value={durationLabel(weekSeconds)} /><Stat label="Foco no mês" value={durationLabel(monthSeconds)} /><Stat label="Melhor sequência" value={`${bestCycleSequence} ciclo(s)`} /></div><div className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto">{filteredHistory.map((session) => { const task = tasks.find((item) => item.id === session.taskId); const project = projects.find((item) => item.id === session.projectId); return <details key={session.id} className="rounded-xl border border-white/[0.07] bg-[#151515] p-3"><summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-xs"><span className="text-white">{task?.title || 'Foco livre'} <span className="text-[#71717A]">· {project?.name || 'Sem projeto'}</span></span><span className="text-[#A1A1AA]">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(session.startedAt))} · {durationLabel(sessionSeconds(session))}</span></summary><div className="mt-3 grid gap-2 text-[10px] text-[#A1A1AA] sm:grid-cols-3"><span>Modo: {session.mode}</span><span>Status: {session.status || (session.completed ? 'Concluída' : 'Interrompida')}</span><span>Término: {session.endedAt ? new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(session.endedAt)) : '—'}</span>{session.concentrationRating && <span>Concentração: {session.concentrationRating}</span>}{session.notes && <p className="sm:col-span-3">{session.notes}</p>}</div></details>; })}{!filteredHistory.length && <p className="py-8 text-center text-xs text-[#71717A]">Nenhuma sessão nesse período.</p>}</div></Panel>}

      {summary && <Panel title="Boa! Você concluiu sua sessão." onClose={commitSummary}><div className="grid grid-cols-2 gap-3 text-xs"><Stat label="Tempo focado" value={durationLabel(sessionSeconds(summary))} /><Stat label="Modo" value={summary.mode} /><Stat label="Tarefa" value={tasks.find((task) => task.id === summary.taskId)?.title || 'Foco livre'} /><Stat label="Projeto" value={projects.find((project) => project.id === summary.projectId)?.name || 'Sem projeto'} /><Stat label="Início" value={new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(summary.startedAt))} /><Stat label="Término" value={summary.endedAt ? new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(summary.endedAt)) : '—'} /></div><fieldset className="mt-5"><legend className="text-xs text-[#A1A1AA]">Como foi sua concentração? (opcional)</legend><div className="mt-2 flex flex-wrap gap-2">{ratings.map((item) => <button key={item} type="button" onClick={() => setRating(item)} className={`rounded-lg border px-3 py-2 text-xs ${rating === item ? 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FBBF24]' : 'border-white/10 text-[#A1A1AA]'}`}>{item}</button>)}</div></fieldset><label className="mt-4 block text-xs text-[#A1A1AA]">Observação (opcional)<textarea rows={3} maxLength={1000} value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} className={`${field} mt-2`} /></label><div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={commitSummary} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8]">Finalizar sessão</button><button type="button" onClick={() => { commitSummary(); onStartBreak(lastConfigRef.current || currentConfig, summary.id); }} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8]">Iniciar descanso</button><button type="button" onClick={() => { commitSummary(); onStart(lastConfigRef.current || currentConfig); }} className="rounded-lg bg-[#F59E0B] px-3 py-2.5 text-xs font-semibold text-black">Começar outro ciclo</button><button type="button" onClick={() => { commitSummary(); onNavigate('Dashboard'); }} className="rounded-lg px-3 py-2.5 text-xs text-[#A1A1AA]">Dashboard</button></div></Panel>}

      {helpOpen && <Panel title="Atalhos de teclado" onClose={() => setHelpOpen(false)}><div className="space-y-2 text-xs text-[#A1A1AA]">{[['Espaço', 'Iniciar, pausar ou retomar'], ['R', 'Interromper sessão (com confirmação)'], ['F', 'Alternar tela cheia'], ['Esc', 'Sair da tela cheia'], ['M', 'Ativar/desativar áudio ambiente'], ['N', 'Preparar nova sessão quando o timer estiver parado'], ['?', 'Abrir esta ajuda']].map(([key, description]) => <p key={key} className="flex justify-between gap-4"><kbd className="rounded bg-white/10 px-2 py-1 text-white">{key}</kbd><span>{description}</span></p>)}</div></Panel>}
    </div>
  );
};

function makeSession(active: ActiveFocusSession, elapsedMs: number, completed: boolean, endedAt: number): FocusSession {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const targetDurationSeconds = active.durationMinutes ? active.durationMinutes * 60 : null;
  return {
    id: active.id || `${active.sessionStartedAt}-${active.taskId || 'open'}`,
    taskId: active.taskId,
    projectId: active.projectId || null,
    mode: active.mode,
    startedAt: active.sessionStartedAt,
    endedAt,
    durationMinutes: Math.floor(seconds / 60),
    completed,
    status: completed ? 'Concluída' : 'Interrompida',
    targetDurationSeconds,
    actualFocusSeconds: seconds,
    breakSeconds: 0,
    concentrationRating: null,
    notes: '',
    cycleIndex: active.cycleIndex || 1,
  };
}

function notifyBrowser(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
}

function playAlertTone(): void {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return;
  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.36);
  window.setTimeout(() => { void context.close(); }, 500);
}

function Panel({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6 ${wide ? 'max-w-4xl' : 'max-w-lg'}`}><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-white">{title}</h2><button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg px-2 py-1 text-xl leading-none text-[#71717A] hover:text-white">×</button></div>{children}</section></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg bg-white/[0.035] p-3"><p className="text-[10px] text-[#71717A]">{label}</p><p className="mt-1 truncate text-sm font-medium text-white">{value}</p></div>;
}
