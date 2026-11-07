import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Check, CheckCircle2, ChevronLeft,
  ChevronRight, Circle, Clock3, KanbanSquare, List, Plus, Search, Trash2,
} from 'lucide-react';
import { createId, localDateKey } from './dashboardService';
import type { DashboardProject, DashboardTask, FocusSession, TaskPriority, TaskStatus, TaskSubtask } from './types';
import { formatDuration } from './DashboardWidgets';

type TaskView = 'Lista' | 'Kanban' | 'Calendário';
type TaskFilter = 'Todas' | 'Hoje' | 'Próximas' | 'Atrasadas' | 'Concluídas' | 'Sem prazo' | 'Minhas prioridades';
type TaskForm = Omit<DashboardTask, 'id' | 'createdAt' | 'updatedAt' | 'history'>;

const card = 'rounded-2xl border border-white/[0.08] bg-[#101010]';
const input = 'w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#F59E0B]/50';
const statusNames: TaskStatus[] = ['A fazer', 'Em andamento', 'Em revisão', 'Concluído'];
const priorities: TaskPriority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

interface TaskManagerPageProps {
  tasks: DashboardTask[];
  dailyPriorityIds: string[];
  projects: DashboardProject[];
  focusHistory: FocusSession[];
  initialProjectId?: string;
  initialTaskId?: string | null;
  onSave: (task: TaskForm, existing?: DashboardTask, createAnother?: boolean) => void;
  onDelete: (task: DashboardTask) => void;
  onUpdate: (task: DashboardTask, action: string) => void;
  onStartFocus: (task: DashboardTask) => void;
  onOpenProject: (id: string) => void;
  onToggleDailyPriority: (task: DashboardTask) => void;
  onNotify: (message: string) => void;
}

function isLate(task: DashboardTask): boolean {
  return Boolean(task.dueAt && task.dueAt < localDateKey() && task.status !== 'Concluído');
}

function formatTrackedTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  if (total < 60) return `${total} s`;
  const minutes = Math.floor(total / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${minutes} min`;
}

function emptyTask(): TaskForm {
  return {
    day: '',
    dependsOnId: '',
    description: '',
    title: '',
    projectId: '',
    category: '',
    tags: [],
    status: 'A fazer',
    priority: 'Média',
    startAt: '',
    estimatedMinutes: 25,
    actualMinutes: 0,
    dueAt: '',
    scheduledAt: '',
    recurrence: 'Não repetir',
    subtasks: [],
    notes: '',
    completed: false,
    archivedAt: '',
  };
}

export const TaskManagerPage: React.FC<TaskManagerPageProps> = ({
  tasks, dailyPriorityIds, projects, focusHistory, initialProjectId = '', initialTaskId = null, onSave, onDelete, onUpdate, onStartFocus, onOpenProject, onToggleDailyPriority, onNotify,
}) => {
  const [view, setView] = useState<TaskView>('Lista');
  const [filter, setFilter] = useState<TaskFilter>('Todas');
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState(initialProjectId);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [dateFilter, setDateFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DashboardTask | null>(null);
  const [details, setDetails] = useState<DashboardTask | null>(null);
  const [month, setMonth] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<'Mês' | 'Semana' | 'Dia'>('Mês');
  const activeTasks = tasks.filter((task) => !task.archivedAt);
  const completedTasks = activeTasks.filter((task) => task.status === 'Concluído');
  const pendingTasks = activeTasks.filter((task) => task.status === 'A fazer');
  const runningTasks = activeTasks.filter((task) => task.status === 'Em andamento');
  const overdueTasks = activeTasks.filter(isLate);
  const categories = [...new Set(activeTasks.map((task) => task.category).filter(Boolean))].sort();
  const tags = [...new Set(activeTasks.flatMap((task) => task.tags))].sort();

  const filteredTasks = useMemo(() => {
    let result = activeTasks.filter((task) => {
      const text = `${task.title} ${task.description}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) return false;
      if (projectFilter && task.projectId !== projectFilter) return false;
      if (statusFilter && task.status !== statusFilter) return false;
      if (priorityFilter && task.priority !== priorityFilter) return false;
      if (categoryFilter && task.category !== categoryFilter) return false;
      if (tagFilter && !task.tags.includes(tagFilter)) return false;
      if (dateFilter && task.dueAt !== dateFilter) return false;
      const today = localDateKey();
      if (filter === 'Hoje' && task.dueAt !== today && task.day !== today) return false;
      if (filter === 'Próximas' && (!task.dueAt || task.dueAt <= today || task.dueAt > localDateKey(new Date(Date.now() + 7 * 86_400_000)))) return false;
      if (filter === 'Atrasadas' && !isLate(task)) return false;
      if (filter === 'Concluídas' && task.status !== 'Concluído') return false;
      if (filter === 'Sem prazo' && task.dueAt) return false;
      if (filter === 'Minhas prioridades' && task.day !== today) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      if (sortBy === 'priority') return priorities.indexOf(b.priority) - priorities.indexOf(a.priority);
      if (sortBy === 'status') return statusNames.indexOf(a.status) - statusNames.indexOf(b.status);
      if (sortBy === 'dueAt') return (a.dueAt || '9999').localeCompare(b.dueAt || '9999');
      return b.createdAt - a.createdAt;
    });
    return result;
  }, [activeTasks, query, projectFilter, statusFilter, priorityFilter, categoryFilter, tagFilter, dateFilter, filter, sortBy]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (task: DashboardTask) => {
    setEditing(task);
    setDialogOpen(true);
  };

  const handleSave = (form: TaskForm, createAnother = false) => {
    onSave(form, editing || undefined, createAnother);
    setEditing(null);
    if (!createAnother) setDialogOpen(false);
  };

  const toggleCompletion = (task: DashboardTask) => {
    const status: TaskStatus = task.status === 'Concluído' ? 'A fazer' : 'Concluído';
    const updated = { ...task, status, completed: status === 'Concluído', updatedAt: Date.now() };
    onUpdate(updated, status === 'Concluído' ? 'Tarefa concluída' : 'Tarefa reaberta');
  };

  const clearFilters = () => {
    setFilter('Todas');
    setProjectFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setTagFilter('');
    setDateFilter('');
    setQuery('');
  };

  const moveTask = (task: DashboardTask, status: TaskStatus) => {
    onUpdate({ ...task, status, completed: status === 'Concluído', updatedAt: Date.now() }, `Status alterado para ${status}`);
  };

  const calendarTasks = filteredTasks.filter((task) => task.dueAt);
  const calendarDate = localDateKey(month);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const dates = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
    const key = localDateKey(date);
    return { date, key, tasks: calendarTasks.filter((task) => task.dueAt === key) };
  });

  useEffect(() => {
    if (!initialTaskId) return;
    const task = tasks.find((item) => item.id === initialTaskId);
    if (task) setDetails(task);
  }, [initialTaskId, tasks]);
  const weekStart = new Date(month);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const calendarDays = calendarMode === 'Mês'
    ? dates
    : Array.from({ length: calendarMode === 'Semana' ? 7 : 1 }, (_, index) => {
        const date = calendarMode === 'Semana' ? new Date(weekStart) : new Date(month);
        if (calendarMode === 'Semana') date.setDate(weekStart.getDate() + index);
        const key = localDateKey(date);
        return { date, key, tasks: calendarTasks.filter((task) => task.dueAt === key) };
      });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F59E0B]">Execução diária</p><h1 className="mt-2 text-2xl font-semibold text-white">Minhas tarefas</h1><p className="mt-1 text-sm text-[#A1A1AA]">Transforme suas ideias em execução.</p></div>
        <button type="button" onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#FBBF24]"><Plus className="h-4 w-4" /> Nova tarefa</button>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Total', activeTasks.length],
          ['Pendentes', pendingTasks.length],
          ['Em andamento', runningTasks.length],
          ['Concluídas', completedTasks.length],
          ['Atrasadas', overdueTasks.length],
        ].map(([label, count]) => <div key={label} className={`${card} p-4`}><p className="text-[11px] text-[#71717A]">{label}</p><p className={`mt-2 text-xl font-semibold ${label === 'Atrasadas' && Number(count) ? 'text-red-300' : 'text-white'}`}>{count}</p></div>)}
      </section>

      <section className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-wrap gap-2">
          <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0A0A0A] px-3 py-2">
            <Search className="h-4 w-4 text-[#71717A]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou descrição..." className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#52525B]" />
          </label>
          <select aria-label="Filtrar por projeto" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-[#D4D4D8]"><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
          <select aria-label="Filtrar por status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-[#D4D4D8]"><option value="">Todos os status</option>{statusNames.map((status) => <option key={status}>{status}</option>)}</select>
          <select aria-label="Filtrar por prioridade" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-[#D4D4D8]"><option value="">Todas as prioridades</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
          <select aria-label="Filtrar por categoria" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-[#D4D4D8]"><option value="">Todas as categorias</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
          <select aria-label="Filtrar por etiqueta" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-[#D4D4D8]"><option value="">Todas as etiquetas</option>{tags.map((tag) => <option key={tag}>{tag}</option>)}</select>
          <input aria-label="Filtrar por data" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-[#D4D4D8]" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(['Todas', 'Hoje', 'Próximas', 'Atrasadas', 'Concluídas', 'Sem prazo', 'Minhas prioridades'] as TaskFilter[]).map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${filter === item ? 'bg-[#F59E0B]/10 text-[#FBBF24]' : 'text-[#71717A] hover:bg-white/5 hover:text-white'}`}>{item}</button>)}
          </div>
          <div className="flex items-center gap-2">
            <select aria-label="Ordenar tarefas" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-white/[0.08] bg-[#0A0A0A] px-2.5 py-2 text-[11px] text-[#A1A1AA]"><option value="createdAt">Mais recentes</option><option value="dueAt">Prazo</option><option value="priority">Prioridade</option><option value="status">Status</option></select>
            <div className="flex rounded-lg border border-white/[0.08] p-0.5">
              {([{ name: 'Lista', icon: List }, { name: 'Kanban', icon: KanbanSquare }, { name: 'Calendário', icon: CalendarDays }] as const).map(({ name, icon: Icon }) => <button key={name} type="button" onClick={() => setView(name)} aria-label={`Visualização ${name}`} className={`rounded-md p-1.5 ${view === name ? 'bg-white/10 text-[#FBBF24]' : 'text-[#71717A] hover:text-white'}`}><Icon className="h-4 w-4" /></button>)}
            </div>
            <button type="button" onClick={clearFilters} className="text-[10px] text-[#71717A] hover:text-white">Limpar filtros</button>
          </div>
        </div>
      </section>

      {filteredTasks.length === 0 ? (
        <section className={`${card} px-5 py-16 text-center`}>
          <CheckCircle2 className="mx-auto h-8 w-8 text-[#52525B]" />
          <h2 className="mt-4 text-sm font-medium text-white">{activeTasks.length ? 'Nenhuma tarefa encontrada com esses filtros.' : 'Você ainda não tem tarefas.'}</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#71717A]">{activeTasks.length ? 'Altere os filtros ou limpe a busca para ver outras tarefas.' : 'Comece criando sua primeira tarefa e transforme seus planos em execução.'}</p>
          {activeTasks.length ? <button type="button" onClick={clearFilters} className="mt-4 text-xs font-semibold text-[#FBBF24]">Limpar filtros</button> : <button type="button" onClick={openNew} className="mt-4 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black">Criar primeira tarefa</button>}
        </section>
      ) : view === 'Lista' ? (
        <section className={`${card} overflow-hidden`}>
          <div className="hidden grid-cols-[32px_minmax(180px,1fr)_minmax(90px,0.7fr)_90px_110px_110px_80px_32px] gap-3 border-b border-white/[0.07] px-5 py-3 text-[10px] uppercase tracking-wider text-[#71717A] lg:grid"><span /><span>Tarefa</span><span>Projeto</span><span>Prioridade</span><span>Prazo</span><span>Status</span><span>Estimativa</span><span /></div>
          {filteredTasks.map((task) => <TaskRow key={task.id} task={task} projects={projects} isDailyPriority={dailyPriorityIds.includes(task.id)} onToggleDailyPriority={() => onToggleDailyPriority(task)} onToggle={() => toggleCompletion(task)} onOpen={() => setDetails(task)} onStatus={(status) => moveTask(task, status)} onDelete={() => onDelete(task)} />)}
        </section>
      ) : view === 'Kanban' ? (
        <section className="grid gap-3 xl:grid-cols-4">
          {statusNames.map((status) => <div key={status} className={`${card} min-h-56 p-3`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const taskId = event.dataTransfer.getData('text/plain'); const task = filteredTasks.find((item) => item.id === taskId); if (task) moveTask(task, status); }}>
            <div className="mb-3 flex items-center justify-between px-1"><h2 className="text-xs font-semibold text-[#D4D4D8]">{status}</h2><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#A1A1AA]">{filteredTasks.filter((task) => task.status === status).length}</span></div>
            <div className="space-y-2">{filteredTasks.filter((task) => task.status === status).map((task) => <button key={task.id} type="button" draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)} onClick={() => setDetails(task)} className="w-full cursor-grab rounded-xl border border-white/[0.07] bg-[#151515] p-3 text-left transition-colors hover:border-[#F59E0B]/25 active:cursor-grabbing">
              <span className="text-xs font-medium text-white">{task.title}</span><span className="mt-2 block text-[10px] text-[#A1A1AA]">{projects.find((project) => project.id === task.projectId)?.name || 'Sem projeto'} · {task.priority}</span>{task.dueAt && <span className={`mt-2 block text-[10px] ${isLate(task) ? 'text-red-300' : 'text-[#71717A]'}`}>{isLate(task) ? 'Atrasada · ' : ''}{new Intl.DateTimeFormat('pt-BR').format(new Date(`${task.dueAt}T12:00:00`))}</span>}
            </button>)}</div>
          </div>)}
        </section>
      ) : (
        <section className={`${card} p-4 sm:p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><h2 className="text-sm font-semibold text-white">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month)}</h2><div className="flex gap-1"><button type="button" aria-label="Período anterior" onClick={() => setMonth(calendarMode === 'Mês' ? new Date(month.getFullYear(), month.getMonth() - 1, 1) : new Date(month.getFullYear(), month.getMonth(), month.getDate() + (calendarMode === 'Semana' ? -7 : -1)))} className="rounded p-1 text-[#A1A1AA] hover:bg-white/5"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Próximo período" onClick={() => setMonth(calendarMode === 'Mês' ? new Date(month.getFullYear(), month.getMonth() + 1, 1) : new Date(month.getFullYear(), month.getMonth(), month.getDate() + (calendarMode === 'Semana' ? 7 : 1)))} className="rounded p-1 text-[#A1A1AA] hover:bg-white/5"><ChevronRight className="h-4 w-4" /></button></div></div>
            <div className="flex gap-1">{(['Mês', 'Semana', 'Dia'] as const).map((mode) => <button key={mode} type="button" onClick={() => setCalendarMode(mode)} className={`rounded-md px-2.5 py-1.5 text-[11px] ${calendarMode === mode ? 'bg-white/10 text-white' : 'text-[#71717A]'}`}>{mode}</button>)}</div>
          </div>
          {calendarMode === 'Mês' && <div className="mb-2 grid grid-cols-7 text-center text-[10px] text-[#71717A]">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <span key={day} className="py-2">{day}</span>)}</div>}
          <div className={`grid ${calendarMode === 'Mês' ? 'grid-cols-7' : 'grid-cols-1 sm:grid-cols-7'} gap-1.5`}>
            {calendarMode === 'Mês' && Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} />)}
            {calendarDays.map(({ date, key, tasks: dayTasks }) => <div key={key} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const taskId = event.dataTransfer.getData('text/plain'); const task = filteredTasks.find((item) => item.id === taskId); if (task) onUpdate({ ...task, dueAt: key }, `Prazo reagendado para ${key}`); }} className={`min-h-[90px] rounded-lg border p-2 ${key === calendarDate ? 'border-[#F59E0B]/25 bg-[#F59E0B]/[0.04]' : 'border-white/[0.06] bg-white/[0.015]'}`}>
              <p className={`text-[10px] ${key === localDateKey() ? 'font-semibold text-[#FBBF24]' : 'text-[#71717A]'}`}>{calendarMode === 'Mês' ? date.getDate() : new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric' }).format(date)}</p>
              <div className="mt-1 space-y-1">{dayTasks.map((task) => <button key={task.id} type="button" draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)} onClick={() => setDetails(task)} className={`block w-full truncate rounded px-1.5 py-1 text-left text-[9px] ${isLate(task) ? 'bg-red-500/10 text-red-300' : task.status === 'Concluído' ? 'bg-white/[0.04] text-[#71717A]' : 'bg-[#F59E0B]/10 text-[#FBBF24]'}`}>{task.scheduledAt ? `${task.scheduledAt} ` : ''}{task.title}</button>)}</div>
            </div>)}
          </div>
        </section>
      )}

      {dialogOpen && <TaskEditor task={editing} tasks={tasks} projects={projects} onClose={() => setDialogOpen(false)} onSave={handleSave} />}
      {details && <TaskDetails task={tasks.find((task) => task.id === details.id) || details} projects={projects} focusHistory={focusHistory.filter((session) => session.taskId === details.id)} onClose={() => setDetails(null)} onEdit={(task) => { setDetails(null); openEdit(task); }} onUpdate={onUpdate} onDelete={onDelete} onStartFocus={onStartFocus} onOpenProject={onOpenProject} />}
    </div>
  );
};

function TaskRow({ task, projects, isDailyPriority, onToggleDailyPriority, onToggle, onOpen, onStatus, onDelete }: {
  task: DashboardTask; projects: DashboardProject[]; isDailyPriority: boolean; onToggleDailyPriority: () => void; onToggle: () => void; onOpen: () => void; onStatus: (status: TaskStatus) => void; onDelete: () => void;
}) {
  return (
    <div className="grid grid-cols-[26px_minmax(0,1fr)_28px] items-center gap-3 border-b border-white/[0.05] px-4 py-3 last:border-0 sm:px-5 lg:grid-cols-[32px_minmax(180px,1fr)_minmax(90px,0.7fr)_90px_110px_110px_80px_32px]">
      <button type="button" onClick={onToggle} aria-label={task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`} className={task.completed ? 'text-[#F59E0B]' : 'text-[#52525B] hover:text-[#F59E0B]'}>{task.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</button>
      <button type="button" onClick={onOpen} className="min-w-0 text-left"><span className={`block truncate text-xs ${task.completed ? 'text-[#71717A] line-through' : 'text-[#E4E4E7]'}`}>{task.title}</span><span className="mt-1 block truncate text-[10px] text-[#71717A] lg:hidden">{task.description || projects.find((project) => project.id === task.projectId)?.name || 'Sem projeto'} · {task.priority} · {task.status}</span></button>
      <span className="hidden truncate text-[11px] text-[#A1A1AA] lg:block">{task.projectId ? projects.find((project) => project.id === task.projectId)?.name || 'Projeto removido' : '—'}</span>
      <span className={`hidden text-[10px] lg:block ${task.priority === 'Urgente' || task.priority === 'Alta' ? 'text-[#FBBF24]' : 'text-[#A1A1AA]'}`}>{task.priority}</span>
      <span className={`hidden text-[10px] lg:block ${isLate(task) ? 'text-red-300' : 'text-[#A1A1AA]'}`}>{task.dueAt ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${task.dueAt}T12:00:00`)) : 'Sem prazo'}</span>
      <select aria-label={`Status de ${task.title}`} value={task.status} onChange={(event) => onStatus(event.target.value as TaskStatus)} className="hidden rounded-md border border-white/[0.08] bg-[#0A0A0A] px-2 py-1.5 text-[10px] text-[#D4D4D8] lg:block">{statusNames.map((status) => <option key={status}>{status}</option>)}</select>
      <span className="hidden items-center gap-1 text-[10px] text-[#A1A1AA] lg:flex"><Clock3 className="h-3 w-3" />{formatDuration(task.estimatedMinutes)}</span>
      <button type="button" onClick={onToggleDailyPriority} aria-label={isDailyPriority ? `Remover ${task.title} das prioridades de hoje` : `Adicionar ${task.title} às prioridades de hoje`} title={isDailyPriority ? 'Prioridade do dia' : 'Adicionar às prioridades de hoje'} className={`hidden rounded p-1 text-[10px] lg:block ${isDailyPriority ? 'text-[#FBBF24]' : 'text-[#52525B] hover:text-[#FBBF24]'}`}>★</button>
      <button type="button" onClick={onDelete} aria-label={`Excluir ${task.title}`} className="text-[#52525B] hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function TaskEditor({ task, tasks, projects, onClose, onSave }: {
  task: DashboardTask | null; tasks: DashboardTask[]; projects: DashboardProject[]; onClose: () => void;
  onSave: (form: TaskForm, createAnother?: boolean) => void;
}) {
  const [form, setForm] = useState<TaskForm>(() => task ? { ...emptyTask(), ...task } : emptyTask());
  const [subtaskText, setSubtaskText] = useState('');
  const [tagsText, setTagsText] = useState(task?.tags.join(', ') || '');
  const [error, setError] = useState('');
  const set = <K extends keyof TaskForm>(key: K, value: TaskForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const addSubtask = () => {
    if (!subtaskText.trim()) return;
    set('subtasks', [...form.subtasks, { id: createId(), title: subtaskText.trim(), completed: false }]);
    setSubtaskText('');
  };
  const submit = (createAnother = false) => {
    if (!form.title.trim()) {
      setError('O título da tarefa é obrigatório.');
      return;
    }
    const otherTasks = tasks.filter((item) => item.id !== task?.id);
    let dependencyId = form.dependsOnId;
    const visited = new Set<string>();
    let createsCycle = false;
    while (dependencyId) {
      if (dependencyId === task?.id || visited.has(dependencyId)) {
        createsCycle = true;
        break;
      }
      visited.add(dependencyId);
      dependencyId = otherTasks.find((item) => item.id === dependencyId)?.dependsOnId || '';
    }
    if (createsCycle) {
      setError('Essa dependência criaria um ciclo. Escolha outra tarefa.');
      return;
    }
    const status = form.status;
    onSave({ ...form, title: form.title.trim(), tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean), completed: status === 'Concluído' }, createAnother);
    if (createAnother) {
      setForm(emptyTask());
      setTagsText('');
      setError('');
    }
  };
  return (
    <DialogShell title={task ? 'Editar tarefa' : 'Nova tarefa'} subtitle="Só o título é obrigatório. Complete os detalhes agora ou depois." onClose={onClose}>
      <div className="mt-5 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <Field label="Nome da tarefa *"><input autoFocus maxLength={180} value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="O que você quer realizar?" className={input} /></Field>
        <Field label="Descrição"><textarea rows={2} maxLength={2000} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Adicione contexto ou instruções..." className={input} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Projeto"><select value={form.projectId} onChange={(event) => set('projectId', event.target.value)} className={input}><option value="">Sem projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
          <Field label="Categoria"><input value={form.category} onChange={(event) => set('category', event.target.value)} placeholder="Ex.: Trabalho, pessoal..." className={input} /></Field>
        </div>
        <Field label="Etiquetas, separadas por vírgula"><input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="design, urgente, pesquisa" className={input} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Prioridade"><select value={form.priority} onChange={(event) => set('priority', event.target.value as TaskPriority)} className={input}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></Field>
          <Field label="Status"><select value={form.status} onChange={(event) => set('status', event.target.value as TaskStatus)} className={input}>{statusNames.map((status) => <option key={status}>{status}</option>)}</select></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Início"><input type="date" value={form.startAt} onChange={(event) => set('startAt', event.target.value)} className={input} /></Field>
          <Field label="Prazo final"><input type="date" value={form.dueAt} onChange={(event) => set('dueAt', event.target.value)} className={input} /></Field>
          <Field label="Horário"><input type="time" value={form.scheduledAt} onChange={(event) => set('scheduledAt', event.target.value)} className={input} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Estimativa (min)"><input type="number" min="1" max="100000" value={form.estimatedMinutes || ''} onChange={(event) => set('estimatedMinutes', Math.max(0, Number(event.target.value)))} className={input} /></Field>
          <Field label="Recorrência"><select value={form.recurrence} onChange={(event) => set('recurrence', event.target.value)} className={input}><option>Não repetir</option><option>Diariamente</option><option>Semanalmente</option><option>Mensalmente</option><option>Personalizado</option></select></Field>
        </div>
        {form.recurrence === 'Personalizado' && <p className="text-[11px] text-amber-200">A recorrência personalizada ainda não gera cópias automaticamente; a tarefa original fica salva.</p>}
        <Field label="Depende de"><select value={form.dependsOnId} onChange={(event) => set('dependsOnId', event.target.value)} className={input}><option value="">Nenhuma dependência</option>{tasks.filter((item) => item.id !== task?.id && item.status !== 'Concluído').map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
        <section className="rounded-xl border border-white/[0.07] p-3">
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-white">Checklist e subtarefas</p><span className="text-[10px] text-[#A1A1AA]">{form.subtasks.filter((item) => item.completed).length}/{form.subtasks.length}</span></div>
          <div className="mt-2 space-y-1">{form.subtasks.map((item, index) => <div key={item.id} className="flex items-center gap-2 py-1"><button type="button" onClick={() => set('subtasks', form.subtasks.map((subtask) => subtask.id === item.id ? { ...subtask, completed: !subtask.completed } : subtask))} className={item.completed ? 'text-[#F59E0B]' : 'text-[#52525B]'}>{item.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</button><input value={item.title} onChange={(event) => set('subtasks', form.subtasks.map((subtask) => subtask.id === item.id ? { ...subtask, title: event.target.value } : subtask))} className="min-w-0 flex-1 bg-transparent text-xs text-[#D4D4D8] outline-none" /><button type="button" disabled={index === 0} onClick={() => { const next = [...form.subtasks]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; set('subtasks', next); }} className="text-[10px] text-[#71717A] disabled:opacity-20" aria-label="Mover subtarefa para cima">↑</button><button type="button" onClick={() => set('subtasks', form.subtasks.filter((subtask) => subtask.id !== item.id))} className="text-[#52525B] hover:text-red-300" aria-label="Excluir subtarefa"><Trash2 className="h-3 w-3" /></button></div>)}</div>
          <div className="mt-2 flex gap-2"><input value={subtaskText} onChange={(event) => setSubtaskText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSubtask(); } }} placeholder="Adicionar subtarefa..." className={`${input} py-2 text-xs`} /><button type="button" onClick={addSubtask} className="rounded-lg border border-white/10 px-3 text-xs text-[#D4D4D8] hover:text-white">Adicionar</button></div>
        </section>
        <Field label="Observações"><textarea rows={2} maxLength={2000} value={form.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Notas pessoais..." className={input} /></Field>
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/[0.07] pt-4">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2.5 text-xs text-[#A1A1AA] hover:text-white">Cancelar</button>
        {!task && <button type="button" onClick={() => submit(true)} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8] hover:bg-white/5">Salvar e criar outra</button>}
        <button type="button" onClick={() => submit(false)} className="rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">Salvar tarefa</button>
      </div>
    </DialogShell>
  );
}

function TaskDetails({ task, projects, focusHistory, onClose, onEdit, onUpdate, onDelete, onStartFocus, onOpenProject }: {
  task: DashboardTask; projects: DashboardProject[]; focusHistory: FocusSession[]; onClose: () => void; onEdit: (task: DashboardTask) => void;
  onUpdate: (task: DashboardTask, action: string) => void; onDelete: (task: DashboardTask) => void;
  onStartFocus: (task: DashboardTask) => void; onOpenProject: (id: string) => void;
}) {
  const [subtaskText, setSubtaskText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const project = projects.find((item) => item.id === task.projectId);
  const update = (patch: Partial<DashboardTask>, action: string) => onUpdate({ ...task, ...patch, updatedAt: Date.now() }, action);
  const completedSubtasks = task.subtasks.filter((item) => item.completed).length;
  return (
    <DialogShell title="Detalhes da tarefa" subtitle="Acompanhe e organize a execução." onClose={onClose}>
      <div className="mt-5 max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <div><h3 className="text-xl font-semibold text-white">{task.title}</h3>{task.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#A1A1AA]">{task.description}</p>}</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <DetailItem label="Status"><select value={task.status} onChange={(event) => { const status = event.target.value as TaskStatus; update({ status, completed: status === 'Concluído' }, `Status alterado para ${status}`); }} className={input}>{statusNames.map((item) => <option key={item}>{item}</option>)}</select></DetailItem>
          <DetailItem label="Prioridade"><span className="text-xs text-[#FBBF24]">{task.priority}</span></DetailItem>
          <DetailItem label="Prazo"><span className={`text-xs ${isLate(task) ? 'text-red-300' : 'text-[#D4D4D8]'}`}>{task.dueAt ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${task.dueAt}T12:00:00`)) : 'Sem prazo'}</span></DetailItem>
          <DetailItem label="Tempo estimado"><span className="text-xs text-[#D4D4D8]">{formatDuration(task.estimatedMinutes)}</span></DetailItem>
          <DetailItem label="Tempo registrado"><span className="text-xs text-[#D4D4D8]">{formatTrackedTime(task.actualSeconds ?? task.actualMinutes * 60)}</span></DetailItem>
          <DetailItem label="Projeto">{project ? <button type="button" onClick={() => { onClose(); onOpenProject(project.id); }} className="truncate text-left text-xs text-[#FBBF24]">{project.name}</button> : <span className="text-xs text-[#71717A]">Sem projeto</span>}</DetailItem>
        </div>
        {task.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{task.tags.map((tag) => <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-[#A1A1AA]">{tag}</span>)}</div>}
        <section className="rounded-xl border border-white/[0.08] p-3.5">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold text-white">Subtarefas</p><span className="text-[10px] text-[#A1A1AA]">{completedSubtasks} de {task.subtasks.length}{task.subtasks.length ? ` · ${Math.round(completedSubtasks / task.subtasks.length * 100)}%` : ''}</span></div>
          {task.subtasks.length > 0 && <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full bg-[#F59E0B] transition-all" style={{ width: `${completedSubtasks / task.subtasks.length * 100}%` }} /></div>}
          <div className="mt-2 space-y-1">{task.subtasks.map((subtask) => <div key={subtask.id} className="flex items-center gap-2 py-1"><button type="button" aria-label={subtask.completed ? 'Reabrir subtarefa' : 'Concluir subtarefa'} onClick={() => update({ subtasks: task.subtasks.map((item) => item.id === subtask.id ? { ...item, completed: !item.completed } : item) }, subtask.completed ? 'Subtarefa reaberta' : 'Subtarefa concluída')} className={subtask.completed ? 'text-[#F59E0B]' : 'text-[#52525B]'}>{subtask.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</button><span className={`text-xs ${subtask.completed ? 'text-[#71717A] line-through' : 'text-[#D4D4D8]'}`}>{subtask.title}</span></div>)}</div>
          <div className="mt-3 flex gap-2"><input value={subtaskText} onChange={(event) => setSubtaskText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && subtaskText.trim()) { update({ subtasks: [...task.subtasks, { id: createId(), title: subtaskText.trim(), completed: false }] }, 'Subtarefa adicionada'); setSubtaskText(''); } }} placeholder="Nova subtarefa..." className={`${input} py-2 text-xs`} /><button type="button" onClick={() => { if (!subtaskText.trim()) return; update({ subtasks: [...task.subtasks, { id: createId(), title: subtaskText.trim(), completed: false }] }, 'Subtarefa adicionada'); setSubtaskText(''); }} className="rounded-lg border border-white/10 px-3 text-xs text-[#D4D4D8]">Adicionar</button></div>
        </section>
        <section className="rounded-xl border border-white/[0.08] p-3.5">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold text-white">Histórico de foco</p><span className="text-[10px] text-[#A1A1AA]">{focusHistory.length} sessão(ões)</span></div>
          <div className="mt-2 space-y-2">{focusHistory.slice(0, 5).map((session) => <div key={session.id} className="flex items-center justify-between gap-3 text-[10px]"><span className="text-[#D4D4D8]">{session.mode} · {session.status || (session.completed ? 'Concluída' : 'Interrompida')}</span><span className="text-[#71717A]">{formatTrackedTime(session.actualFocusSeconds ?? session.durationMinutes * 60)} · {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(session.startedAt))}</span></div>)}{!focusHistory.length && <p className="text-[10px] text-[#71717A]">As sessões associadas a esta tarefa aparecerão aqui.</p>}</div>
        </section>
        {task.notes && <section><p className="text-xs font-semibold text-white">Observações</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#A1A1AA]">{task.notes}</p></section>}
        <section><p className="text-xs font-semibold text-white">Histórico</p><ul className="mt-2 space-y-2">{task.history.map((item) => <li key={item.id} className="flex justify-between gap-3 text-[10px] text-[#A1A1AA]"><span>{item.action}</span><time>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.createdAt))}</time></li>)}</ul></section>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
        <button type="button" onClick={() => onStartFocus(task)} className="rounded-lg bg-[#F59E0B] px-3 py-2 text-xs font-semibold text-black hover:bg-[#FBBF24]">Iniciar foco</button>
        <button type="button" onClick={() => onUpdate({ ...task, status: 'Concluído', completed: true, updatedAt: Date.now() }, 'Tarefa concluída')} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#D4D4D8] hover:text-white">Marcar concluída</button>
        <button type="button" onClick={() => onEdit(task)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#D4D4D8] hover:text-white">Editar</button>
        <button type="button" onClick={() => {
          if (!confirmDelete) { setConfirmDelete(true); return; }
          onDelete(task);
          onClose();
        }} className="rounded-lg px-3 py-2 text-xs text-red-300 hover:bg-red-500/10">{confirmDelete ? 'Confirmar exclusão' : 'Excluir'}</button>
        <button type="button" onClick={() => { const duplicate = { ...task, id: createId(), title: `${task.title} (cópia)`, completed: false, status: 'A fazer' as const, createdAt: Date.now(), updatedAt: Date.now(), history: [] }; onUpdate(duplicate, 'Tarefa duplicada'); onClose(); }} className="ml-auto rounded-lg px-3 py-2 text-xs text-[#A1A1AA] hover:text-white">Duplicar</button>
      </div>
    </DialogShell>
  );
}

function DialogShell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" className="my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#131313] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><h2 id="task-dialog-title" className="text-lg font-semibold text-white">{title}</h2>{subtitle && <p className="mt-1 text-xs text-[#A1A1AA]">{subtitle}</p>}</div><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#71717A] hover:text-white" aria-label="Fechar"><ChevronRight className="h-4 w-4 rotate-45" /></button></div>{children}</section></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[#D4D4D8]">{label}<div className="mt-1.5">{children}</div></label>;
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0 rounded-lg bg-white/[0.035] p-2.5"><p className="text-[9px] uppercase tracking-wider text-[#71717A]">{label}</p><div className="mt-1 truncate">{children}</div></div>;
}
