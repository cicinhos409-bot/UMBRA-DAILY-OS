import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Focus, Plus,
  Settings2, Sparkles, Trash2,
} from 'lucide-react';
import { createId, localDateKey } from './dashboardService';
import type { DashboardProject, DashboardTask, ScheduleItem } from './types';

type CalendarView = 'Dia' | 'Semana' | 'Mês';
type BlockType = NonNullable<ScheduleItem['type']>;

interface CalendarPlannerPageProps {
  schedule: ScheduleItem[];
  tasks: DashboardTask[];
  projects: DashboardProject[];
  onSaveBlock: (block: ScheduleItem) => void;
  onDeleteBlock: (block: ScheduleItem) => void;
  onScheduleTask: (task: DashboardTask, day: string, time: string, durationMinutes: number) => void;
  onUpdateScheduledTask: (task: DashboardTask, day: string, time: string, durationMinutes: number) => void;
  onOpenTask: (taskId: string) => void;
  onStartFocus: (task: DashboardTask) => void;
  onOpenDailyAi: (action?: string) => void;
  onNotify: (message: string) => void;
}

interface PlannerPreferences {
  startHour: number;
  endHour: number;
  capacityHours: number;
  view: CalendarView;
}

interface BlockForm {
  title: string;
  description: string;
  day: string;
  time: string;
  durationMinutes: number;
  type: BlockType;
  taskId: string;
  projectId: string;
  notes: string;
}

interface CalendarBlock extends BlockForm {
  id: string;
  completed: boolean;
  task?: DashboardTask;
  scheduledBlock?: ScheduleItem;
}

const PREF_KEY = 'umbra-planner-preferences-v1';
const defaultPreferences: PlannerPreferences = { startHour: 7, endHour: 22, capacityHours: 8, view: 'Semana' };
const blockTypes: BlockType[] = ['Tarefa', 'Trabalho profundo', 'Reunião', 'Pausa', 'Rotina pessoal', 'Planejamento', 'Personalizado'];
const card = 'rounded-2xl border border-white/[0.08] bg-[#101010]';
const field = 'w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#F59E0B]/50';
const hourHeight = 48;

function readPreferences(): PlannerPreferences {
  try {
    const saved = window.localStorage.getItem(PREF_KEY);
    if (!saved) return defaultPreferences;
    const parsed = JSON.parse(saved) as Partial<PlannerPreferences>;
    return {
      startHour: Math.min(20, Math.max(0, Number(parsed.startHour) || defaultPreferences.startHour)),
      endHour: Math.min(24, Math.max(Math.min(20, Math.max(0, Number(parsed.startHour) || defaultPreferences.startHour)) + 1, Number(parsed.endHour) || defaultPreferences.endHour)),
      capacityHours: Math.min(16, Math.max(1, Number(parsed.capacityHours) || defaultPreferences.capacityHours)),
      view: parsed.view === 'Dia' || parsed.view === 'Mês' ? parsed.view : 'Semana',
    };
  } catch {
    return defaultPreferences;
  }
}

function dateKey(date: Date): string {
  return localDateKey(date);
}

function parseDate(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 12);
}

function addDays(day: string, amount: number): string {
  const date = parseDate(day);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

function startOfWeek(day: string): string {
  const date = parseDate(day);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return dateKey(date);
}

function dateLabel(day: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  return new Intl.DateTimeFormat('pt-BR', options).format(parseDate(day));
}

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + (minute || 0);
}

function minutesToTime(minutes: number): string {
  const safe = Math.max(0, Math.min(1439, minutes));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

function makeBlocks(schedule: ScheduleItem[], tasks: DashboardTask[], projects: DashboardProject[]): CalendarBlock[] {
  const blocks: CalendarBlock[] = schedule.map((item) => {
    const task = item.taskId ? tasks.find((candidate) => candidate.id === item.taskId) : undefined;
    const projectId = item.projectId || task?.projectId || '';
    return {
      id: item.id,
      title: task?.title || item.title,
      description: item.description || '',
      day: item.day,
      time: task?.scheduledAt || item.time,
      durationMinutes: task?.estimatedMinutes || item.durationMinutes,
      type: item.type || (task ? 'Tarefa' : 'Personalizado'),
      taskId: item.taskId || '',
      projectId,
      notes: item.notes || '',
      completed: task ? task.status === 'Concluído' : item.completed,
      task,
      scheduledBlock: item,
    };
  });
  const linkedTaskIds = new Set(schedule.map((item) => item.taskId).filter(Boolean));
  tasks.filter((task) => task.scheduledAt && !task.archivedAt && !linkedTaskIds.has(task.id)).forEach((task) => {
    blocks.push({
      id: `task-${task.id}`,
      title: task.title,
      description: task.description,
      day: task.scheduledDay || task.day || localDateKey(),
      time: task.scheduledAt,
      durationMinutes: Math.max(1, task.estimatedMinutes || 30),
      type: 'Tarefa',
      taskId: task.id,
      projectId: task.projectId,
      notes: task.notes,
      completed: task.status === 'Concluído',
      task,
    });
  });
  return blocks.map((block) => {
    if (block.projectId && !projects.some((project) => project.id === block.projectId)) return { ...block, projectId: '' };
    return block;
  });
}

function formFromBlock(block: CalendarBlock): BlockForm {
  return {
    title: block.title,
    description: block.description,
    day: block.day,
    time: block.time,
    durationMinutes: Math.max(1, block.durationMinutes),
    type: block.type,
    taskId: block.taskId,
    projectId: block.projectId,
    notes: block.notes,
  };
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function BlockDialog({ form, tasks, projects, editing, onClose, onSave, onDelete }: {
  form: BlockForm;
  tasks: DashboardTask[];
  projects: DashboardProject[];
  editing: CalendarBlock | null;
  onClose: () => void;
  onSave: (form: BlockForm) => void;
  onDelete: (block: CalendarBlock) => void;
}) {
  const [draft, setDraft] = useState(form);
  const linkedTask = tasks.find((task) => task.id === draft.taskId);
  const endTime = minutesToTime(timeToMinutes(draft.time) + Number(draft.durationMinutes || 0));
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="planner-dialog-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between"><div><h2 id="planner-dialog-title" className="text-lg font-semibold text-white">{editing ? 'Editar bloco' : 'Novo bloco de horário'}</h2><p className="mt-1 text-xs text-[#A1A1AA]">Os horários são salvos localmente neste dispositivo.</p></div><button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5">×</button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-xs text-[#D4D4D8]">Título<input required maxLength={120} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={`${field} mt-1.5`} /></label>
          <label className="text-xs text-[#D4D4D8]">Data<input type="date" required value={draft.day} onChange={(event) => setDraft({ ...draft, day: event.target.value })} className={`${field} mt-1.5`} /></label>
          <label className="text-xs text-[#D4D4D8]">Tipo<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as BlockType })} className={`${field} mt-1.5`}>{blockTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className="text-xs text-[#D4D4D8]">Início<input type="time" required value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} className={`${field} mt-1.5`} /></label>
          <label className="text-xs text-[#D4D4D8]">Duração (minutos)<input type="number" min="5" max="1440" step="5" required value={draft.durationMinutes} onChange={(event) => setDraft({ ...draft, durationMinutes: Number(event.target.value) })} className={`${field} mt-1.5`} /><span className="mt-1 block text-[10px] text-[#71717A]">Término calculado: {endTime}</span></label>
          <label className="text-xs text-[#D4D4D8]">Vincular tarefa (opcional)<select disabled={Boolean(editing?.taskId)} value={draft.taskId} onChange={(event) => { const task = tasks.find((item) => item.id === event.target.value); setDraft({ ...draft, taskId: event.target.value, title: task?.title || draft.title, projectId: task?.projectId || draft.projectId, durationMinutes: task?.estimatedMinutes || draft.durationMinutes, type: task ? 'Tarefa' : draft.type }); }} className={`${field} mt-1.5`}><option value="">Sem tarefa vinculada</option>{tasks.filter((task) => !task.archivedAt && task.status !== 'Concluído').map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
          <label className="text-xs text-[#D4D4D8]">Projeto (opcional)<select value={draft.projectId} onChange={(event) => setDraft({ ...draft, projectId: event.target.value })} className={`${field} mt-1.5`}><option value="">Sem projeto</option>{projects.filter((project) => !project.archivedAt).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label className="sm:col-span-2 text-xs text-[#D4D4D8]">Descrição<textarea rows={2} maxLength={1000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className={`${field} mt-1.5 resize-y`} /></label>
          <label className="sm:col-span-2 text-xs text-[#D4D4D8]">Observações<textarea rows={2} maxLength={1000} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className={`${field} mt-1.5 resize-y`} /></label>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
          <div>{editing && !linkedTask && <button type="button" onClick={() => onDelete(editing)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" />Excluir bloco</button>}</div>
          <div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-lg px-3 py-2.5 text-xs text-[#A1A1AA] hover:text-white">Cancelar</button><button type="submit" className="rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">{linkedTask ? 'Salvar agendamento' : 'Salvar bloco'}</button></div>
        </div>
      </form>
    </div>
  );
}

function BlockCard({ block, projectName, style, onEdit, onStart, draggable = true }: {
  block: CalendarBlock;
  projectName?: string;
  style?: React.CSSProperties;
  onEdit: () => void;
  onStart: () => void;
  draggable?: boolean;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={(event) => event.dataTransfer.setData('application/umbra-calendar-block', block.id)}
      className={`group overflow-hidden rounded-lg border px-2 py-1.5 text-left ${block.completed ? 'border-white/[0.06] bg-white/[0.035] text-[#71717A]' : block.type === 'Pausa' ? 'border-sky-400/15 bg-sky-400/[0.06] text-sky-100' : block.type === 'Reunião' ? 'border-violet-400/20 bg-violet-400/[0.07] text-violet-100' : 'border-[#F59E0B]/20 bg-[#F59E0B]/[0.08] text-[#FDE68A]'}`}
      style={style}
      title={`${block.title} · ${block.time} · ${durationLabel(block.durationMinutes)}`}
    >
      <button type="button" onClick={onEdit} className="block w-full truncate text-left text-[10px] font-medium">{block.title}</button>
      <p className="mt-0.5 truncate text-[9px] opacity-70">{block.time} · {durationLabel(block.durationMinutes)}{projectName ? ` · ${projectName}` : ''}</p>
      {block.task && <button type="button" onClick={(event) => { event.stopPropagation(); onStart(); }} className="mt-1 inline-flex items-center gap-1 rounded bg-black/20 px-1.5 py-1 text-[9px] text-white hover:bg-black/40"><Focus className="h-2.5 w-2.5" />Foco</button>}
    </div>
  );
}

export const CalendarPlannerPage: React.FC<CalendarPlannerPageProps> = ({
  schedule, tasks, projects, onSaveBlock, onDeleteBlock, onScheduleTask, onUpdateScheduledTask,
  onOpenTask, onStartFocus, onOpenDailyAi, onNotify,
}) => {
  const [preferences, setPreferences] = useState<PlannerPreferences>(readPreferences);
  const [view, setView] = useState<CalendarView>(preferences.view);
  const [selectedDay, setSelectedDay] = useState(localDateKey());
  const [dialog, setDialog] = useState<{ form: BlockForm; editing: CalendarBlock | null } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const blocks = useMemo(() => makeBlocks(schedule, tasks, projects), [schedule, tasks, projects]);
  const today = localDateKey();
  const weekStart = startOfWeek(selectedDay);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const visibleDays = view === 'Dia' ? [selectedDay] : weekDays;
  const visibleBlocks = blocks.filter((block) => visibleDays.includes(block.day));
  const unscheduled = tasks.filter((task) => !task.archivedAt && task.status !== 'Concluído' && !task.scheduledAt);
  const overdue = tasks.filter((task) => !task.archivedAt && task.status !== 'Concluído' && task.dueAt && task.dueAt < today);
  const dayBlocks = blocks.filter((block) => block.day === selectedDay);
  const plannedMinutes = dayBlocks.reduce((total, block) => total + block.durationMinutes, 0);
  const dayHours = plannedMinutes / 60;
  const conflictPairs = dayBlocks.flatMap((block, index) => dayBlocks.slice(index + 1)
    .filter((other) => overlaps(timeToMinutes(block.time), timeToMinutes(block.time) + block.durationMinutes, timeToMinutes(other.time), timeToMinutes(other.time) + other.durationMinutes))
    .map((other) => `${block.id}:${other.id}`));
  const hourSlots = Array.from({ length: Math.max(1, (preferences.endHour - preferences.startHour) * 2) }, (_, index) => preferences.startHour * 60 + index * 30);
  const currentDate = new Date(now);
  const currentMinute = currentDate.getHours() * 60 + currentDate.getMinutes();
  const showCurrentTime = selectedDay === today && currentMinute >= preferences.startHour * 60 && currentMinute <= preferences.endHour * 60;

  useEffect(() => {
    try {
      window.localStorage.setItem(PREF_KEY, JSON.stringify({ ...preferences, view }));
    } catch {
      onNotify('Não foi possível salvar as preferências do Planner neste navegador.');
    }
  }, [preferences, view]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const openNew = (day = selectedDay, time = '09:00', task?: DashboardTask) => {
    setDialog({
      form: {
        title: task?.title || '',
        description: task?.description || '',
        day,
        time,
        durationMinutes: Math.max(5, task?.estimatedMinutes || 30),
        type: task ? 'Tarefa' : 'Personalizado',
        taskId: task?.id || '',
        projectId: task?.projectId || '',
        notes: task?.notes || '',
      },
      editing: null,
    });
  };

  const openEdit = (block: CalendarBlock) => setDialog({ form: formFromBlock(block), editing: block });

  const saveForm = (form: BlockForm) => {
    if (!form.title.trim() || !form.day || !form.time || form.durationMinutes < 5) {
      onNotify('Informe título, data, horário e uma duração de pelo menos 5 minutos.');
      return;
    }
    const start = timeToMinutes(form.time);
    const end = start + form.durationMinutes;
    if (end > 1440) {
      onNotify('O bloco não pode ultrapassar a meia-noite. Ajuste o horário ou a duração.');
      return;
    }
    const conflict = blocks.find((block) => block.day === form.day && block.id !== dialog?.editing?.id && overlaps(start, end, timeToMinutes(block.time), timeToMinutes(block.time) + block.durationMinutes));
    if (conflict && !window.confirm(`Este horário se sobrepõe a “${conflict.title}”. Salvar mesmo assim?`)) return;
    if (form.taskId) {
      const task = tasks.find((item) => item.id === form.taskId);
      if (!task) {
        onNotify('A tarefa selecionada não está mais disponível.');
        return;
      }
      if (dialog?.editing?.task && dialog.editing.task.id === task.id) onUpdateScheduledTask(task, form.day, form.time, form.durationMinutes);
      else onScheduleTask(task, form.day, form.time, form.durationMinutes);
      if (dialog?.editing?.scheduledBlock) {
        onSaveBlock({ ...dialog.editing.scheduledBlock, title: form.title.trim(), description: form.description, day: form.day, time: form.time, durationMinutes: form.durationMinutes, type: form.type, taskId: task.id, projectId: form.projectId, notes: form.notes });
      }
    } else {
      const item: ScheduleItem = {
        id: dialog?.editing?.scheduledBlock?.id || createId(),
        day: form.day,
        title: form.title.trim(),
        time: form.time,
        durationMinutes: form.durationMinutes,
        completed: dialog?.editing?.completed || false,
        type: form.type,
        description: form.description,
        projectId: form.projectId,
        notes: form.notes,
      };
      onSaveBlock(item);
      if (dialog?.editing?.task) onUpdateScheduledTask(dialog.editing.task, form.day, '', form.durationMinutes);
    }
    setSelectedDay(form.day);
    setDialog(null);
  };

  const moveBlock = (block: CalendarBlock, day: string, time: string) => {
    const start = timeToMinutes(time);
    const conflict = blocks.find((candidate) => candidate.id !== block.id && candidate.day === day && overlaps(start, start + block.durationMinutes, timeToMinutes(candidate.time), timeToMinutes(candidate.time) + candidate.durationMinutes));
    if (conflict && !window.confirm(`Mover para ${dateLabel(day)} às ${time} cria conflito com “${conflict.title}”. Continuar?`)) return;
    if (block.task) {
      onUpdateScheduledTask(block.task, day, time, block.durationMinutes);
      if (block.scheduledBlock) onSaveBlock({ ...block.scheduledBlock, day, time, durationMinutes: block.durationMinutes });
    } else if (block.scheduledBlock) {
      onSaveBlock({ ...block.scheduledBlock, day, time });
    }
    setSelectedDay(day);
    onNotify(`“${block.title}” reagendado para ${dateLabel(day)} às ${time}.`);
  };

  const dropOnSlot = (event: React.DragEvent, day: string, time: string) => {
    event.preventDefault();
    event.stopPropagation();
    const blockId = event.dataTransfer.getData('application/umbra-calendar-block');
    const taskId = event.dataTransfer.getData('application/umbra-calendar-task') || event.dataTransfer.getData('text/plain');
    const block = blocks.find((item) => item.id === blockId);
    if (block) {
      moveBlock(block, day, time);
      return;
    }
    const task = tasks.find((item) => item.id === taskId && !item.archivedAt && item.status !== 'Concluído');
    if (task) {
      if (task.scheduledAt) {
        const existing = blocks.find((item) => item.taskId === task.id);
        if (existing) moveBlock(existing, day, time);
        else onUpdateScheduledTask(task, day, time, task.estimatedMinutes || 30);
      } else {
        const conflict = blocks.find((item) => item.day === day && overlaps(timeToMinutes(time), timeToMinutes(time) + Math.max(5, task.estimatedMinutes || 30), timeToMinutes(item.time), timeToMinutes(item.time) + item.durationMinutes));
        if (conflict && !window.confirm(`O horário se sobrepõe a “${conflict.title}”. Agendar mesmo assim?`)) return;
        onScheduleTask(task, day, time, Math.max(5, task.estimatedMinutes || 30));
      }
      setSelectedDay(day);
      onNotify(`“${task.title}” agendado para ${dateLabel(day)} às ${time}.`);
    }
  };

  const dropOnTimeline = (event: React.DragEvent<HTMLDivElement>, day: string) => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const minutesFromStart = Math.max(0, (event.clientY - bounds.top) / hourHeight * 60);
    const snappedTime = minutesToTime(preferences.startHour * 60 + Math.round(minutesFromStart / 30) * 30);
    dropOnSlot(event, day, snappedTime);
  };

  const deleteBlock = (block: CalendarBlock) => {
    if (!window.confirm(`Excluir o bloco “${block.title}”?`)) return;
    if (block.scheduledBlock) onDeleteBlock(block.scheduledBlock);
    if (block.task) onUpdateScheduledTask(block.task, block.day, '', block.durationMinutes);
    onNotify('Bloco removido. A tarefa vinculada foi preservada.');
    setDialog(null);
  };

  const changePeriod = (direction: number) => {
    if (view === 'Mês') {
      const current = parseDate(selectedDay);
      const dayOfMonth = current.getDate();
      current.setDate(1);
      current.setMonth(current.getMonth() + direction);
      const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      current.setDate(Math.min(dayOfMonth, lastDay));
      setSelectedDay(dateKey(current));
      return;
    }
    setSelectedDay(addDays(selectedDay, direction * (view === 'Dia' ? 1 : 7)));
  };

  const monthDate = parseDate(selectedDay);
  const monthFirst = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12);
  const monthDays = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const monthCells = Array.from({ length: Math.ceil(((monthFirst.getDay() + 6) % 7 + monthDays) / 7) * 7 }, (_, index) => {
    const day = index - ((monthFirst.getDay() + 6) % 7) + 1;
    return day > 0 && day <= monthDays ? dateKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12)) : '';
  });

  const plannerSuggestions = [
    { title: 'Organizar minha semana', action: 'Organizar meu dia' },
    { title: 'Encontrar horários livres', action: 'Organizar meu dia' },
    { title: 'Identificar sobrecarga', action: 'Analisar minha produtividade' },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F59E0B]">Planejar. Executar. Reorganizar. Continuar.</p><h1 className="mt-2 text-2xl font-semibold text-white">Calendário e Planner</h1><p className="mt-1 text-sm text-[#A1A1AA]">Organize seu tempo. Transforme planos em execução.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelectedDay(today)} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8] hover:bg-white/[0.04]">Hoje</button>
          <button type="button" onClick={() => openNew()} className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-3.5 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]"><Plus className="h-3.5 w-3.5" />Novo bloco</button>
          <button type="button" onClick={() => onOpenDailyAi('Organizar meu dia')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#F59E0B]/20 px-3 py-2.5 text-xs text-[#FBBF24] hover:bg-[#F59E0B]/[0.05]"><Sparkles className="h-3.5 w-3.5" />Daily AI</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className={`${card} p-3`}><p className="text-[10px] text-[#71717A]">Blocos agendados</p><p className="mt-1 text-lg font-semibold text-white">{dayBlocks.length}</p></div>
        <div className={`${card} p-3`}><p className="text-[10px] text-[#71717A]">Horas planejadas</p><p className="mt-1 text-lg font-semibold text-white">{dayHours.toFixed(1)}h</p></div>
      <div className={`${card} p-3`}><p className="text-[10px] text-[#71717A]">Horas disponíveis</p><p className="mt-1 text-lg font-semibold text-white">{Math.max(0, preferences.capacityHours - dayHours).toFixed(1)}h</p></div>
        <div className={`${card} p-3`}><p className="text-[10px] text-[#71717A]">Tarefas atrasadas</p><p className={`mt-1 text-lg font-semibold ${overdue.length ? 'text-amber-300' : 'text-white'}`}>{overdue.length}</p></div>
      <div className={`${card} p-3`}><p className="text-[10px] text-[#71717A]">Capacidade diária</p><p className="mt-1 text-lg font-semibold text-white">{preferences.capacityHours}h</p></div>
      </div>

      <section className={`${card} p-3 sm:p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5"><button type="button" aria-label="Período anterior" onClick={() => changePeriod(-1)} className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-white"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Próximo período" onClick={() => changePeriod(1)} className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-white"><ChevronRight className="h-4 w-4" /></button><h2 className="ml-1 text-sm font-semibold text-white">{view === 'Mês' ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(monthDate) : view === 'Dia' ? dateLabel(selectedDay, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : `${dateLabel(weekStart, { day: 'numeric', month: 'short' })} – ${dateLabel(weekDays[6], { day: 'numeric', month: 'short', year: 'numeric' })}`}</h2></div>
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-black/20 p-1">{(['Dia', 'Semana', 'Mês'] as const).map((item) => <button key={item} type="button" onClick={() => { setView(item); setPreferences((current) => ({ ...current, view: item })); }} className={`rounded-md px-3 py-1.5 text-[10px] ${view === item ? 'bg-[#F59E0B]/15 text-[#FBBF24]' : 'text-[#71717A] hover:text-white'}`}>{item}</button>)}<button type="button" onClick={() => setSettingsOpen((value) => !value)} aria-label="Configurações do Planner" className="ml-1 rounded-md p-1.5 text-[#71717A] hover:text-white"><Settings2 className="h-3.5 w-3.5" /></button></div>
        </div>
        {settingsOpen && <div className="mt-4 grid gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3 sm:grid-cols-3"><label className="text-[10px] text-[#A1A1AA]">Início da agenda<input type="number" min="0" max={preferences.endHour - 1} value={preferences.startHour} onChange={(event) => setPreferences((current) => ({ ...current, startHour: Number(event.target.value) }))} className={`${field} mt-1`} /></label><label className="text-[10px] text-[#A1A1AA]">Fim da agenda<input type="number" min={preferences.startHour + 1} max="24" value={preferences.endHour} onChange={(event) => setPreferences((current) => ({ ...current, endHour: Number(event.target.value) }))} className={`${field} mt-1`} /></label><label className="text-[10px] text-[#A1A1AA]">Capacidade diária (h)<input type="number" min="1" max="16" value={preferences.capacityHours} onChange={(event) => setPreferences((current) => ({ ...current, capacityHours: Number(event.target.value) }))} className={`${field} mt-1`} /></label></div>}
        {dayHours > preferences.capacityHours && <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-2.5 text-[10px] leading-4 text-amber-100"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Há {dayHours.toFixed(1)}h planejadas para {dateLabel(selectedDay)}, acima da capacidade configurada de {preferences.capacityHours}h.</p>}
        {conflictPairs.length > 0 && <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/15 bg-red-500/[0.04] p-2.5 text-[10px] leading-4 text-red-200"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{conflictPairs.length} conflito(s) de horário detectado(s) para {dateLabel(selectedDay)}. Revise os blocos antes de reorganizar o dia.</p>}

        {view === 'Mês' ? (
          <div className="mt-4">
            <div className="grid grid-cols-7 border-b border-white/[0.07] pb-2 text-center text-[10px] text-[#71717A]">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="grid grid-cols-7">{monthCells.map((day, index) => {
              const items = day ? blocks.filter((block) => block.day === day) : [];
              const due = day ? tasks.filter((task) => !task.archivedAt && task.dueAt === day && task.status !== 'Concluído') : [];
              const milestones = day ? projects.flatMap((project) => project.milestones.filter((milestone) => !milestone.completed && milestone.dueAt === day).map((milestone) => `${project.name}: ${milestone.name}`)) : [];
              return <button key={`${day}-${index}`} type="button" disabled={!day} onClick={() => { if (day) { setSelectedDay(day); setView('Dia'); } }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => day && dropOnSlot(event, day, '09:00')} className={`min-h-[82px] border-b border-r border-white/[0.05] p-1.5 text-left transition-colors hover:bg-white/[0.025] sm:min-h-[110px] sm:p-2 ${day === today ? 'bg-[#F59E0B]/[0.04]' : ''} ${!day ? 'cursor-default' : ''}`}><span className={`text-[10px] ${day === today ? 'font-bold text-[#FBBF24]' : day ? 'text-[#A1A1AA]' : 'text-transparent'}`}>{day ? Number(day.slice(-2)) : '0'}</span><div className="mt-1 space-y-0.5">{items.slice(0, 2).map((block) => <span key={block.id} className="block truncate rounded bg-[#F59E0B]/10 px-1 py-0.5 text-[8px] text-[#FBBF24]">{block.time} {block.title}</span>)}{due.slice(0, Math.max(0, 2 - items.length)).map((task) => <span key={task.id} className="block truncate rounded bg-red-500/10 px-1 py-0.5 text-[8px] text-red-300">{task.title}</span>)}{milestones.slice(0, 1).map((milestone) => <span key={milestone} className="block truncate text-[8px] text-violet-300">{milestone}</span>)}{items.length + due.length + milestones.length > 3 && <span className="text-[8px] text-[#71717A]">+{items.length + due.length + milestones.length - 3} mais</span>}</div></button>;
            })}</div>
          </div>
        ) : (
          <div className={`mt-4 ${view === 'Semana' ? 'hidden md:block' : ''}`}>
            {view === 'Semana' && <div className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))] border-b border-white/[0.07]"><span />{weekDays.map((day) => <button key={day} type="button" onClick={() => { setSelectedDay(day); setView('Dia'); }} className={`border-l border-white/[0.06] px-1 py-2 text-center text-[9px] sm:text-[10px] ${day === today ? 'text-[#FBBF24]' : 'text-[#A1A1AA]'}`}>{dateLabel(day, { weekday: 'short', day: 'numeric' })}</button>)}</div>}
            <div className="relative overflow-x-auto">
              <div className={`grid min-w-[560px] ${view === 'Semana' ? 'grid-cols-[44px_repeat(7,minmax(0,1fr))]' : 'grid-cols-[54px_minmax(0,1fr)]'}`}>
                <div>{hourSlots.filter((_, index) => index % 2 === 0).map((minute) => <div key={minute} style={{ height: hourHeight }} className="relative -top-2 text-[9px] text-[#52525B]">{minutesToTime(minute)}</div>)}</div>
                {visibleDays.map((day) => {
                  const items = visibleBlocks.filter((block) => block.day === day);
                  return <div key={day} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOnTimeline(event, day)} className="relative border-l border-white/[0.06]" style={{ height: (preferences.endHour - preferences.startHour) * hourHeight }}>
                    {Array.from({ length: preferences.endHour - preferences.startHour }, (_, index) => preferences.startHour + index).map((hour) => <div key={hour} className="absolute w-full border-t border-white/[0.05]" style={{ top: indexTop(hour, preferences.startHour), height: hourHeight * 2 }}>{[0, 1].map((half) => { const minute = hour * 60 + half * 30; const time = minutesToTime(minute); return <button key={half} type="button" aria-label={`Criar bloco ${dateLabel(day)} às ${time}`} onClick={() => openNew(day, time)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOnSlot(event, day, time)} className="absolute left-0 right-0 h-1/2 border-b border-dashed border-white/[0.025] text-left hover:bg-[#F59E0B]/[0.025]" style={{ top: `${half * 50}%` }} />; })}</div>)}
                    {items.map((block) => {
                      const top = (timeToMinutes(block.time) - preferences.startHour * 60) / 60 * hourHeight;
                      const height = Math.max(25, block.durationMinutes / 60 * hourHeight);
                      return <BlockCard key={block.id} block={block} projectName={projects.find((project) => project.id === block.projectId)?.name} style={{ position: 'absolute', top: Math.max(0, top), height: Math.max(25, Math.min(height, (preferences.endHour - preferences.startHour) * hourHeight - Math.max(0, top))), left: view === 'Semana' ? '2%' : '1%', width: view === 'Semana' ? '96%' : '98%', zIndex: 2 }} onEdit={() => openEdit(block)} onStart={() => block.task && onStartFocus(block.task)} />;
                    })}
                    {showCurrentTime && day === today && <div className="pointer-events-none absolute left-0 right-0 z-10 border-t border-red-400" style={{ top: (currentMinute - preferences.startHour * 60) / 60 * hourHeight }}><span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" /></div>}
                  </div>;
                })}
              </div>
            </div>
            {view === 'Semana' && <div className="mt-4 space-y-3 md:hidden">{weekDays.map((day) => {
              const items = blocks.filter((block) => block.day === day).sort((a, b) => a.time.localeCompare(b.time));
              return <section key={day} className="rounded-xl border border-white/[0.07] p-3"><button type="button" onClick={() => { setSelectedDay(day); setView('Dia'); }} className={`text-xs font-medium ${day === today ? 'text-[#FBBF24]' : 'text-white'}`}>{dateLabel(day, { weekday: 'long', day: 'numeric', month: 'long' })}</button><div className="mt-2 space-y-2">{items.map((block) => <div key={block.id} className="flex items-start gap-2 rounded-lg bg-white/[0.025] p-2"><span className="font-mono text-[10px] text-[#FBBF24]">{block.time}</span><button type="button" onClick={() => openEdit(block)} className="min-w-0 flex-1 truncate text-left text-[10px] text-[#D4D4D8]">{block.title} · {durationLabel(block.durationMinutes)}</button></div>)}{!items.length && <p className="text-[10px] text-[#52525B]">Sem blocos agendados.</p>}</div></section>;
            })}</div>}
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-white">{view === 'Dia' ? 'Blocos do dia' : view === 'Semana' ? 'Agenda da semana' : `Atividades de ${dateLabel(selectedDay)}`}</h2><p className="mt-1 text-[10px] text-[#71717A]">Arraste blocos para outro horário; tarefas pendentes podem ser arrastadas da lista ao lado.</p></div><button type="button" onClick={() => openNew()} className="rounded-lg border border-white/10 p-2 text-[#A1A1AA] hover:text-white" aria-label="Adicionar bloco"><Plus className="h-4 w-4" /></button></div>
          <div className="mt-3 space-y-2">{(view === 'Mês' ? dayBlocks : visibleBlocks).sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time)).map((block) => <div key={`${block.id}-${block.day}`} className="flex items-start gap-3 rounded-xl border border-white/[0.06] p-3"><span className="w-24 shrink-0 text-[10px] text-[#FBBF24]">{view !== 'Dia' && `${dateLabel(block.day, { weekday: 'short', day: 'numeric' })} · `}{block.time}</span><button type="button" onClick={() => block.task ? onOpenTask(block.task.id) : openEdit(block)} className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-medium text-white">{block.title}</span><span className="mt-1 block text-[10px] text-[#71717A]">{block.type} · {durationLabel(block.durationMinutes)}{block.projectId ? ` · ${projects.find((project) => project.id === block.projectId)?.name || ''}` : ''}{block.completed ? ' · Concluído' : ''}</span></button>{block.task && <button type="button" onClick={() => onStartFocus(block.task!)} className="rounded-lg border border-[#F59E0B]/20 px-2.5 py-2 text-[9px] text-[#FBBF24] hover:bg-[#F59E0B]/[0.05]">Focus</button>}<button type="button" onClick={() => openEdit(block)} className="rounded-lg p-2 text-[#71717A] hover:text-white" aria-label={`Editar ${block.title}`}><Settings2 className="h-3.5 w-3.5" /></button></div>)}{(view === 'Mês' ? dayBlocks : visibleBlocks).length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-[#71717A]">Nenhum bloco no período selecionado. Clique em um horário para criar um.</p>}</div>
        </section>

        <aside className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2"><div><h2 className="text-sm font-semibold text-white">Tarefas sem agendamento</h2><p className="mt-1 text-[10px] text-[#71717A]">{unscheduled.length} tarefa(s) pendente(s)</p></div><CalendarDays className="h-4 w-4 text-[#FBBF24]" /></div>
          <div className="mt-3 max-h-[440px] space-y-2 overflow-y-auto">{unscheduled.slice(0, 30).map((task) => <article key={task.id} draggable onDragStart={(event) => { event.dataTransfer.setData('application/umbra-calendar-task', task.id); event.dataTransfer.setData('text/plain', task.id); }} className="rounded-xl border border-white/[0.07] bg-black/15 p-3"><button type="button" onClick={() => onOpenTask(task.id)} className="block w-full truncate text-left text-xs font-medium text-white hover:text-[#FBBF24]">{task.title}</button><p className="mt-1 text-[10px] text-[#71717A]">{projects.find((project) => project.id === task.projectId)?.name || 'Sem projeto'} · {task.priority} · {task.estimatedMinutes || 30} min{task.dueAt ? ` · prazo ${dateLabel(task.dueAt, { day: 'numeric', month: 'short' })}` : ''}</p><button type="button" onClick={() => openNew(selectedDay, '09:00', task)} className="mt-2 inline-flex items-center gap-1 rounded-md border border-[#F59E0B]/15 px-2 py-1.5 text-[9px] text-[#FBBF24] hover:bg-[#F59E0B]/[0.05]"><Plus className="h-3 w-3" />Agendar</button></article>)}{!unscheduled.length && <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[10px] text-[#71717A]">Todas as tarefas abertas já têm horário previsto ou foram concluídas.</p>}</div>
          <div className="mt-4 border-t border-white/[0.07] pt-3"><h3 className="text-[10px] font-semibold text-[#A1A1AA]">Ações de planejamento</h3>{plannerSuggestions.map((item) => <button key={item.title} type="button" onClick={() => onOpenDailyAi(item.action)} className="mt-2 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[10px] text-[#D4D4D8] hover:bg-white/[0.04] hover:text-[#FBBF24]">{item.title}<Sparkles className="h-3 w-3" /></button>)}</div>
        </aside>
      </div>
      {dialog && <BlockDialog form={dialog.form} tasks={tasks} projects={projects} editing={dialog.editing} onClose={() => setDialog(null)} onSave={saveForm} onDelete={deleteBlock} />}
    </div>
  );
};

function indexTop(hour: number, startHour: number): number {
  return (hour - startHour) * hourHeight;
}
