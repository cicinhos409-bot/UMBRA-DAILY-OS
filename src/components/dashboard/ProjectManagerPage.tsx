import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Archive, CalendarDays, Check, CheckCircle2, Circle,
  FileText, FolderKanban, LayoutGrid, List, Plus, Search, Trash2,
} from 'lucide-react';
import { createId, localDateKey } from './dashboardService';
import type {
  DashboardProject, DashboardTask, FocusSession, ProjectFile, ProjectMilestone, ProjectPhase, ProjectStatus, TaskActivity,
} from './types';
import { formatDuration } from './DashboardWidgets';

type ProjectView = 'Cards' | 'Lista';
type ProjectFilter = 'Todos' | 'Ativos' | 'Em andamento' | 'Pausados' | 'Concluídos' | 'Arquivados';
type ProjectForm = Omit<DashboardProject, 'id' | 'createdAt' | 'phases' | 'milestones' | 'activity' | 'files'>;

const card = 'rounded-2xl border border-white/[0.08] bg-[#101010]';
const input = 'w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#F59E0B]/50';
const statuses: ProjectStatus[] = ['Ativo', 'Em andamento', 'Pausado', 'Concluído'];
const priorities = ['Baixa', 'Média', 'Alta', 'Urgente'] as const;
const templates = ['Projeto em branco', 'Projeto pessoal', 'Desenvolvimento de software', 'Marketing e conteúdo', 'Lançamento de produto', 'Gestão de negócios'];
const templatePhases: Record<string, string[]> = {
  'Projeto pessoal': ['Planejamento', 'Execução', 'Revisão'],
  'Desenvolvimento de software': ['Planejamento', 'Desenvolvimento', 'Testes', 'Lançamento'],
  'Marketing e conteúdo': ['Estratégia', 'Produção', 'Distribuição', 'Análise'],
  'Lançamento de produto': ['Planejamento', 'Desenvolvimento', 'Testes', 'Lançamento', 'Pós-lançamento'],
  'Gestão de negócios': ['Planejamento', 'Operação', 'Avaliação'],
};

interface ProjectManagerPageProps {
  projects: DashboardProject[];
  tasks: DashboardTask[];
  focusHistory: FocusSession[];
  projectId: string | null;
  onNavigate: (module: 'Projetos' | 'Tarefas' | 'Dashboard', projectId?: string) => void;
  onSaveProject: (project: ProjectForm, existing?: DashboardProject, phases?: ProjectPhase[]) => void;
  onDeleteProject: (project: DashboardProject) => void;
  onUpdateProject: (project: DashboardProject, action: string) => void;
  onUpdateTask: (task: DashboardTask, action: string) => void;
  onNotify: (message: string) => void;
  onStartFocus: (projectId: string) => void;
}

function blankProject(): ProjectForm {
  return {
    name: '',
    description: '',
    objective: '',
    category: '',
    color: '#F59E0B',
    icon: 'folder',
    status: 'Ativo',
    priority: 'Média',
    startAt: '',
    dueAt: '',
    archivedAt: '',
  };
}

function progressFor(projectTasks: DashboardTask[]): number {
  return projectTasks.length ? Math.round(projectTasks.filter((task) => task.status === 'Concluído').length / projectTasks.length * 100) : 0;
}

function focusTimeLabel(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes} min`;
}

function dateLabel(date: string): string {
  return date ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`)) : 'Sem prazo';
}

export const ProjectManagerPage: React.FC<ProjectManagerPageProps> = ({
  projects, tasks, focusHistory, projectId, onNavigate, onSaveProject, onDeleteProject, onUpdateProject, onUpdateTask, onNotify, onStartFocus,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ProjectFilter>('Todos');
  const [view, setView] = useState<ProjectView>('Cards');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DashboardProject | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const project = projects.find((item) => item.id === projectId);

  const visibleProjects = useMemo(() => projects.filter((item) => {
    const text = `${item.name} ${item.description} ${item.objective}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (filter === 'Arquivados') return Boolean(item.archivedAt);
    if (item.archivedAt) return false;
    if (filter === 'Todos') return true;
    if (filter === 'Ativos') return item.status === 'Ativo' || item.status === 'Em andamento';
    if (filter === 'Concluídos') return item.status === 'Concluído';
    return item.status === filter;
  }), [projects, query, filter]);

  if (projectId && project) {
    return <ProjectDetailsPage project={project} tasks={tasks.filter((task) => task.projectId === project.id && !task.archivedAt)} focusHistory={focusHistory.filter((session) => session.projectId === project.id)} onBack={() => onNavigate('Projetos')} onEdit={() => { onNavigate('Projetos'); setEditing(project); }} onUpdateProject={onUpdateProject} onUpdateTask={onUpdateTask} onOpenTasks={() => onNavigate('Tarefas', project.id)} onStartFocus={() => onStartFocus(project.id)} onNotify={onNotify} />;
  }

  if (projectId && !project) {
    return <section className={`${card} p-8 text-center`}><h1 className="text-lg font-semibold text-white">Projeto não encontrado</h1><p className="mt-2 text-sm text-[#A1A1AA]">Ele pode ter sido excluído ou o endereço está incorreto.</p><button type="button" onClick={() => onNavigate('Projetos')} className="mt-4 text-xs text-[#FBBF24]">Voltar aos projetos</button></section>;
  }

  const archived = projects.filter((item) => item.archivedAt).length;
  const current = projects.filter((item) => !item.archivedAt);
  const active = current.filter((item) => item.status === 'Ativo' || item.status === 'Em andamento').length;
  const paused = current.filter((item) => item.status === 'Pausado').length;
  const complete = current.filter((item) => item.status === 'Concluído').length;
  const newTasksCount = (id: string) => tasks.filter((task) => task.projectId === id && !task.archivedAt).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F59E0B]">Planeje com propósito</p><h1 className="mt-2 text-2xl font-semibold text-white">Meus projetos</h1><p className="mt-1 text-sm text-[#A1A1AA]">Organize seus objetivos. Acompanhe sua evolução. Execute até o final.</p></div>
        <button type="button" onClick={() => { setEditing(null); setCreateOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]"><Plus className="h-4 w-4" /> Novo projeto</button>
      </header>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[['Total', current.length], ['Ativos', active], ['Pausados', paused], ['Concluídos', complete], ['Tarefas vinculadas', tasks.filter((task) => task.projectId && !task.archivedAt).length]].map(([label, count]) => <div key={label} className={`${card} p-4`}><p className="text-[11px] text-[#71717A]">{label}</p><p className="mt-2 text-xl font-semibold text-white">{count}</p></div>)}
      </section>
      <section className={`${card} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0A0A0A] px-3 py-2"><Search className="h-4 w-4 text-[#71717A]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar projetos..." className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#52525B]" /></label>
          <div className="flex flex-wrap items-center gap-1">{(['Todos', 'Ativos', 'Em andamento', 'Pausados', 'Concluídos', 'Arquivados'] as ProjectFilter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-2.5 py-2 text-[10px] ${filter === item ? 'bg-[#F59E0B]/10 text-[#FBBF24]' : 'text-[#71717A] hover:text-white'}`}>{item}{item === 'Arquivados' ? ` (${archived})` : ''}</button>)}
            <span className="mx-1 h-5 w-px bg-white/10" />
            <button type="button" onClick={() => setView('Cards')} aria-label="Visualização em cards" className={`rounded p-2 ${view === 'Cards' ? 'text-[#FBBF24]' : 'text-[#71717A]'}`}><LayoutGrid className="h-4 w-4" /></button><button type="button" onClick={() => setView('Lista')} aria-label="Visualização em lista" className={`rounded p-2 ${view === 'Lista' ? 'text-[#FBBF24]' : 'text-[#71717A]'}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </section>
      {visibleProjects.length === 0 ? (
        <section className={`${card} px-5 py-16 text-center`}><FolderKanban className="mx-auto h-8 w-8 text-[#52525B]" /><h2 className="mt-4 text-sm font-medium text-white">{current.length || filter === 'Arquivados' ? 'Nenhum projeto encontrado.' : 'Nenhum projeto por aqui ainda.'}</h2><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#71717A]">Organize seus objetivos em projetos e acompanhe cada etapa.</p>{current.length ? <button type="button" onClick={() => { setQuery(''); setFilter('Todos'); }} className="mt-4 text-xs text-[#FBBF24]">Limpar filtros</button> : <button type="button" onClick={() => setCreateOpen(true)} className="mt-4 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black">Criar primeiro projeto</button>}</section>
      ) : view === 'Cards' ? (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visibleProjects.map((item) => <ProjectCard key={item.id} project={item} tasks={tasks.filter((task) => task.projectId === item.id && !task.archivedAt)} onOpen={() => onNavigate('Projetos', item.id)} onEdit={() => setEditing(item)} onUpdate={onUpdateProject} onDelete={() => onDeleteProject(item)} onNotify={onNotify} />)}
        </section>
      ) : (
        <section className={`${card} divide-y divide-white/[0.06]`}>
          {visibleProjects.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 p-4 sm:px-5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <button type="button" onClick={() => onNavigate('Projetos', item.id)} className="min-w-[160px] flex-1 text-left"><span className="block text-xs font-medium text-white">{item.name}</span><span className="mt-1 block text-[10px] text-[#71717A]">{item.description || 'Sem descrição'}</span></button>
            <span className="text-[10px] text-[#A1A1AA]">{item.status}</span><span className="text-[10px] text-[#A1A1AA]">{newTasksCount(item.id)} tarefas</span><span className="text-[10px] text-[#A1A1AA]">{dateLabel(item.dueAt)}</span><button type="button" onClick={() => setEditing(item)} className="rounded px-2 py-1 text-[10px] text-[#71717A] hover:text-white">Editar</button>
          </div>)}
        </section>
      )}
      {(createOpen || editing) && <ProjectEditor project={editing} onClose={() => { setEditing(null); setCreateOpen(false); }} onSave={(form, phases) => { onSaveProject(form, editing || undefined, phases); setEditing(null); setCreateOpen(false); }} />}
    </div>
  );
};

function ProjectCard({ project, tasks, onOpen, onEdit, onUpdate, onDelete, onNotify }: {
  project: DashboardProject; tasks: DashboardTask[]; onOpen: () => void; onEdit: () => void;
  onUpdate: (project: DashboardProject, action: string) => void; onDelete: () => void; onNotify: (message: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = progressFor(tasks);
  const pending = tasks.filter((task) => task.status !== 'Concluído');
  const next = [...pending].sort((a, b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999'))[0];
  const update = (patch: Partial<DashboardProject>, action: string) => onUpdate({ ...project, ...patch }, action);
  return (
    <article className={`${card} group p-5 transition-colors hover:border-white/[0.14]`}>
      <div className="flex items-start gap-3">
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left"><h2 className="truncate text-sm font-semibold text-white">{project.name}</h2><p className="mt-1 line-clamp-2 min-h-9 text-xs leading-5 text-[#A1A1AA]">{project.description || project.objective || 'Sem descrição.'}</p></button>
        <div className="relative"><button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-md px-2 py-1 text-[#71717A] hover:bg-white/5 hover:text-white" aria-label="Opções do projeto">···</button>{menuOpen && <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-white/10 bg-[#181818] p-1 shadow-xl">
          <MenuButton onClick={onOpen}>Abrir</MenuButton><MenuButton onClick={onEdit}>Editar</MenuButton><MenuButton onClick={() => { onUpdate({ ...project, id: createId(), name: `${project.name} (cópia)`, createdAt: Date.now(), activity: [] }, 'Projeto duplicado'); setMenuOpen(false); onNotify('Projeto duplicado.'); }}>Duplicar</MenuButton>
          <MenuButton onClick={() => { update({ archivedAt: project.archivedAt ? '' : localDateKey() }, project.archivedAt ? 'Projeto desarquivado' : 'Projeto arquivado'); setMenuOpen(false); }}> {project.archivedAt ? 'Desarquivar' : 'Arquivar'}</MenuButton>
          <MenuButton danger onClick={() => { setMenuOpen(false); onDelete(); }}>Excluir</MenuButton>
        </div>}</div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-[#D4D4D8]">{project.status}</span><span className="rounded-full bg-white/[0.04] px-2 py-1 text-[10px] text-[#A1A1AA]">{project.priority} prioridade</span>{project.category && <span className="text-[10px] text-[#71717A]">{project.category}</span>}</div>
      <div className="mt-5 flex items-center justify-between"><span className="text-[10px] text-[#A1A1AA]">{tasks.filter((task) => task.status === 'Concluído').length} de {tasks.length} tarefas</span><span className="font-mono text-xs text-[#FBBF24]">{progress}%</span></div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full transition-all" style={{ backgroundColor: project.color, width: `${progress}%` }} /></div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-[#71717A]"><span>{next ? `Próxima: ${next.title}` : 'Nenhuma tarefa pendente'}</span><span className="shrink-0">{dateLabel(project.dueAt)}</span></div>
      <button type="button" onClick={onOpen} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#FBBF24] hover:text-white">Abrir projeto <ArrowRight className="h-3 w-3" /></button>
    </article>
  );
}

function ProjectEditor({ project, onClose, onSave }: {
  project: DashboardProject | null; onClose: () => void; onSave: (form: ProjectForm, phases: ProjectPhase[]) => void;
}) {
  const [form, setForm] = useState<ProjectForm>(() => project ? {
    name: project.name, description: project.description, objective: project.objective,
    category: project.category, color: project.color, icon: project.icon, status: project.status,
    priority: project.priority, startAt: project.startAt, dueAt: project.dueAt, archivedAt: project.archivedAt,
  } : blankProject());
  const [template, setTemplate] = useState(templates[0]);
  const set = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const title = form.name.trim();
    if (!title) return;
    const phases = project?.phases || (templatePhases[template] || []).map((name) => ({ id: createId(), name, description: '', startAt: '', dueAt: '', completed: false }));
    onSave({ ...form, name: title }, phases);
  };
  return (
    <DialogShell title={project ? 'Editar projeto' : 'Novo projeto'} subtitle="Defina o espaço e personalize as etapas quando quiser." onClose={onClose}>
      <form onSubmit={submit} className="mt-5 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        {!project && <Field label="Começar a partir de um modelo"><select value={template} onChange={(event) => setTemplate(event.target.value)} className={input}>{templates.map((item) => <option key={item}>{item}</option>)}</select>{templatePhases[template] && <span className="mt-1 block text-[10px] text-[#71717A]">Inclui fases editáveis: {templatePhases[template].join(' · ')}</span>}</Field>}
        <Field label="Nome do projeto *"><input autoFocus required maxLength={100} value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Nome do projeto" className={input} /></Field>
        <Field label="Descrição"><textarea rows={2} maxLength={1000} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Uma breve descrição" className={input} /></Field>
        <Field label="Objetivo principal"><textarea rows={2} maxLength={1000} value={form.objective} onChange={(event) => set('objective', event.target.value)} placeholder="Qual resultado esse projeto deve alcançar?" className={input} /></Field>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Categoria"><input value={form.category} onChange={(event) => set('category', event.target.value)} placeholder="Pessoal, trabalho..." className={input} /></Field><Field label="Status"><select value={form.status} onChange={(event) => set('status', event.target.value as ProjectStatus)} className={input}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></Field></div>
        <div className="grid gap-3 sm:grid-cols-3"><Field label="Prioridade"><select value={form.priority} onChange={(event) => set('priority', event.target.value as ProjectForm['priority'])} className={input}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></Field><Field label="Cor"><input type="color" value={form.color} onChange={(event) => set('color', event.target.value)} className={`${input} h-10 p-1`} /></Field><Field label="Ícone"><select value={form.icon} onChange={(event) => set('icon', event.target.value)} className={input}><option value="folder">Pasta</option><option value="code">Código</option><option value="target">Objetivo</option><option value="sparkles">Criativo</option></select></Field></div>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Data de início"><input type="date" value={form.startAt} onChange={(event) => set('startAt', event.target.value)} className={input} /></Field><Field label="Prazo final (opcional)"><input type="date" value={form.dueAt} onChange={(event) => set('dueAt', event.target.value)} className={input} /></Field></div>
        <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4"><button type="button" onClick={onClose} className="rounded-lg px-3 py-2.5 text-xs text-[#A1A1AA]">Cancelar</button><button type="submit" className="rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black">{project ? 'Salvar alterações' : 'Criar projeto'}</button></div>
      </form>
    </DialogShell>
  );
}

type ProjectTab = 'Visão geral' | 'Tarefas' | 'Planejamento' | 'Arquivos' | 'Histórico';

function ProjectDetailsPage({ project, tasks, focusHistory, onBack, onEdit, onUpdateProject, onUpdateTask, onOpenTasks, onStartFocus, onNotify }: {
  project: DashboardProject; tasks: DashboardTask[]; focusHistory: FocusSession[]; onBack: () => void; onEdit: () => void;
  onUpdateProject: (project: DashboardProject, action: string) => void;
  onUpdateTask: (task: DashboardTask, action: string) => void; onOpenTasks: () => void; onStartFocus: () => void; onNotify: (message: string) => void;
}) {
  const [tab, setTab] = useState<ProjectTab>('Visão geral');
  const [phaseName, setPhaseName] = useState('');
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [fileError, setFileError] = useState('');
  const [confirmProjectDelete, setConfirmProjectDelete] = useState(false);
  const progress = progressFor(tasks);
  const pending = tasks.filter((task) => task.status !== 'Concluído');
  const overdue = tasks.filter((task) => task.dueAt && task.dueAt < localDateKey() && task.status !== 'Concluído');
  const projectFocusSeconds = focusHistory.reduce((total, session) => total + (session.actualFocusSeconds ?? session.durationMinutes * 60), 0);
  const update = (patch: Partial<DashboardProject>, action: string) => onUpdateProject({ ...project, ...patch, activity: [{ id: createId(), action, createdAt: Date.now() }, ...project.activity] }, action);

  const addPhase = () => {
    if (!phaseName.trim()) return;
    const phase: ProjectPhase = { id: createId(), name: phaseName.trim(), description: '', startAt: '', dueAt: '', completed: false };
    update({ phases: [...project.phases, phase] }, 'Fase adicionada');
    setPhaseName('');
  };
  const addMilestone = () => {
    if (!milestoneName.trim()) return;
    const milestone: ProjectMilestone = { id: createId(), name: milestoneName.trim(), description: '', dueAt: milestoneDate, completed: false };
    update({ milestones: [...project.milestones, milestone] }, 'Marco adicionado');
    setMilestoneName('');
    setMilestoneDate('');
  };
  const addFile = (file?: File) => {
    setFileError('');
    if (!file) return;
    if (file.size > 1_000_000) { setFileError('O arquivo deve ter no máximo 1 MB para armazenamento neste navegador.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') { setFileError('Não foi possível ler o arquivo.'); return; }
      const attachment: ProjectFile = { id: createId(), name: file.name, data: reader.result, createdAt: Date.now() };
      update({ files: [...project.files, attachment] }, 'Arquivo adicionado');
    };
    reader.onerror = () => setFileError('Não foi possível ler o arquivo.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Todos os projetos</button>
      <header className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3"><span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold text-white">{project.name}</h1><span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-[#D4D4D8]">{project.status}</span><span className="rounded-full bg-white/[0.04] px-2 py-1 text-[10px] text-[#A1A1AA]">{project.priority} prioridade</span></div><p className="mt-2 text-sm text-[#A1A1AA]">{project.description || 'Sem descrição.'}</p><p className="mt-1 text-xs text-[#71717A]">Prazo: {dateLabel(project.dueAt)}</p></div></div>
          <div className="flex gap-2"><button type="button" onClick={onStartFocus} className="rounded-lg bg-[#F59E0B] px-3 py-2 text-xs font-semibold text-black hover:bg-[#FBBF24]">Focar neste projeto</button><button type="button" onClick={onEdit} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#D4D4D8] hover:text-white">Editar projeto</button></div>
        </div>
        <div className="mt-5 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full" style={{ backgroundColor: project.color, width: `${progress}%` }} /></div><span className="font-mono text-xs text-[#FBBF24]">{progress}%</span></div>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-white/[0.08]">{(['Visão geral', 'Tarefas', 'Planejamento', 'Arquivos', 'Histórico'] as ProjectTab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs ${tab === item ? 'border-[#F59E0B] text-[#FBBF24]' : 'border-transparent text-[#71717A] hover:text-white'}`}>{item}</button>)}</nav>
      {tab === 'Visão geral' && <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <section className={`${card} p-5`}><h2 className="text-sm font-semibold text-white">Objetivo do projeto</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#A1A1AA]">{project.objective || 'Adicione um objetivo para manter o projeto direcionado.'}</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{[['Tarefas', tasks.length], ['Concluídas', tasks.filter((task) => task.status === 'Concluído').length], ['Pendentes', pending.length], ['Atrasadas', overdue.length], ['Foco', focusTimeLabel(projectFocusSeconds)]].map(([label, value]) => <div key={label} className="rounded-lg bg-white/[0.035] p-3"><p className="text-[10px] text-[#71717A]">{label}</p><p className={`mt-1 text-lg font-semibold ${label === 'Atrasadas' && Number(value) ? 'text-red-300' : 'text-white'}`}>{value}</p></div>)}</div><button type="button" onClick={onOpenTasks} className="mt-5 inline-flex items-center gap-2 text-xs text-[#FBBF24]">Abrir tarefas do projeto <ArrowRight className="h-3.5 w-3.5" /></button></section>
        <section className={`${card} p-5`}><h2 className="text-sm font-semibold text-white">Próximas entregas</h2><div className="mt-3 space-y-2">{[...pending].sort((a, b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999')).slice(0, 5).map((task) => <button type="button" key={task.id} onClick={onOpenTasks} className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/[0.025] px-3 py-2.5 text-left"><span className="truncate text-xs text-[#D4D4D8]">{task.title}</span><span className="shrink-0 text-[10px] text-[#71717A]">{dateLabel(task.dueAt)}</span></button>)}</div><h3 className="mt-5 text-xs font-semibold text-white">Atividade recente</h3><div className="mt-2 space-y-2">{project.activity.slice(0, 5).map((item) => <p key={item.id} className="flex justify-between gap-2 text-[10px] text-[#A1A1AA]"><span>{item.action}</span><time>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(item.createdAt))}</time></p>)}{!project.activity.length && <p className="text-[10px] text-[#71717A]">As atualizações do projeto aparecerão aqui.</p>}</div></section>
      </div>}
      {tab === 'Tarefas' && <section className={`${card} p-5`}><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Tarefas do projeto</h2><button type="button" onClick={onOpenTasks} className="rounded-lg bg-[#F59E0B] px-3 py-2 text-xs font-semibold text-black">Gerenciar tarefas</button></div><div className="mt-4 space-y-2">{tasks.map((task) => <button type="button" key={task.id} onClick={onOpenTasks} className="flex w-full items-center gap-3 rounded-lg bg-white/[0.025] p-3 text-left"><span className={task.status === 'Concluído' ? 'text-[#F59E0B]' : 'text-[#52525B]'}>{task.status === 'Concluído' ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</span><span className="min-w-0 flex-1 truncate text-xs text-[#D4D4D8]">{task.title}</span><span className="text-[10px] text-[#A1A1AA]">{task.status}</span></button>)}{!tasks.length && <p className="py-8 text-center text-xs text-[#71717A]">Nenhuma tarefa vinculada ainda.</p>}</div></section>}
      {tab === 'Planejamento' && <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${card} p-5`}><h2 className="text-sm font-semibold text-white">Fases</h2><div className="mt-3 space-y-2">{project.phases.map((phase, index) => <div key={phase.id} className="flex items-start gap-2 rounded-lg bg-white/[0.025] p-3"><button type="button" onClick={() => update({ phases: project.phases.map((item) => item.id === phase.id ? { ...item, completed: !item.completed } : item) }, phase.completed ? 'Fase reaberta' : 'Fase concluída')} className={phase.completed ? 'mt-0.5 text-[#F59E0B]' : 'mt-0.5 text-[#52525B]'}>{phase.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</button><div className="min-w-0 flex-1"><input value={phase.name} onChange={(event) => update({ phases: project.phases.map((item) => item.id === phase.id ? { ...item, name: event.target.value } : item) }, 'Fase editada')} className={`w-full bg-transparent text-xs outline-none ${phase.completed ? 'text-[#71717A] line-through' : 'text-[#D4D4D8]'}`} /><div className="mt-2 flex gap-2"><button type="button" disabled={index === 0} onClick={() => { const phases = [...project.phases]; [phases[index - 1], phases[index]] = [phases[index], phases[index - 1]]; update({ phases }, 'Fases reordenadas'); }} className="text-[10px] text-[#71717A] disabled:opacity-20">↑</button><button type="button" onClick={() => update({ phases: project.phases.filter((item) => item.id !== phase.id) }, 'Fase removida')} className="text-[10px] text-[#71717A] hover:text-red-300">Excluir</button></div></div></div>)}</div><div className="mt-3 flex gap-2"><input value={phaseName} onChange={(event) => setPhaseName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addPhase(); } }} placeholder="Nova fase..." className={`${input} py-2 text-xs`} /><button type="button" onClick={addPhase} className="rounded-lg border border-white/10 px-3 text-xs text-[#D4D4D8]">Adicionar</button></div></section>
        <section className={`${card} p-5`}><h2 className="text-sm font-semibold text-white">Marcos</h2><div className="mt-3 space-y-2">{project.milestones.map((milestone) => <div key={milestone.id} className="flex items-center gap-2 rounded-lg bg-white/[0.025] p-3"><button type="button" onClick={() => update({ milestones: project.milestones.map((item) => item.id === milestone.id ? { ...item, completed: !item.completed } : item) }, milestone.completed ? 'Marco reaberto' : 'Marco concluído')} className={milestone.completed ? 'text-[#F59E0B]' : 'text-[#52525B]'}>{milestone.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</button><span className={`min-w-0 flex-1 truncate text-xs ${milestone.completed ? 'text-[#71717A] line-through' : 'text-[#D4D4D8]'}`}>{milestone.name}</span><span className="text-[10px] text-[#71717A]">{dateLabel(milestone.dueAt)}</span><button type="button" onClick={() => update({ milestones: project.milestones.filter((item) => item.id !== milestone.id) }, 'Marco removido')} className="text-[#52525B] hover:text-red-300" aria-label="Excluir marco"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input value={milestoneName} onChange={(event) => setMilestoneName(event.target.value)} placeholder="Nome do marco..." className={`${input} py-2 text-xs`} /><input aria-label="Prazo do marco" type="date" value={milestoneDate} onChange={(event) => setMilestoneDate(event.target.value)} className={`${input} py-2 text-xs`} /><button type="button" onClick={addMilestone} className="rounded-lg border border-white/10 px-3 text-xs text-[#D4D4D8]">Adicionar</button></div></section>
      </div>}
      {tab === 'Arquivos' && <section className={`${card} p-5`}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-white">Arquivos do projeto</h2><p className="mt-1 text-[10px] text-[#71717A]">Anexos armazenados somente neste navegador (máximo de 1 MB por arquivo).</p></div><label className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs text-[#D4D4D8] hover:text-white">Adicionar arquivo<input type="file" className="sr-only" onChange={(event) => addFile(event.target.files?.[0])} /></label></div>{fileError && <p role="alert" className="mt-3 text-xs text-red-300">{fileError}</p>}<div className="mt-4 space-y-2">{project.files.map((file) => <div key={file.id} className="flex items-center gap-3 rounded-lg bg-white/[0.025] p-3"><FileText className="h-4 w-4 text-[#F59E0B]" /><a href={file.data} download={file.name} className="min-w-0 flex-1 truncate text-xs text-[#D4D4D8] hover:text-[#FBBF24]">{file.name}</a><button type="button" onClick={() => update({ files: project.files.filter((item) => item.id !== file.id) }, 'Arquivo removido')} className="text-[10px] text-[#71717A] hover:text-red-300">Excluir</button></div>)}{!project.files.length && <p className="py-8 text-center text-xs text-[#71717A]">Nenhum arquivo anexado.</p>}</div></section>}
      {tab === 'Histórico' && <section className={`${card} p-5`}><h2 className="text-sm font-semibold text-white">Histórico do projeto</h2><div className="mt-4 space-y-3">{project.activity.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 border-b border-white/[0.05] pb-3"><span className="text-xs text-[#D4D4D8]">{item.action}</span><time className="shrink-0 text-[10px] text-[#71717A]">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt))}</time></div>)}{!project.activity.length && <p className="py-8 text-center text-xs text-[#71717A]">O histórico será preenchido conforme o projeto for atualizado.</p>}</div><div className="mt-6 border-t border-white/[0.07] pt-5"><button type="button" onClick={() => { if (!confirmProjectDelete) { setConfirmProjectDelete(true); return; } onUpdateProject({ ...project, archivedAt: localDateKey(), activity: [{ id: createId(), action: 'Projeto arquivado', createdAt: Date.now() }, ...project.activity] }, 'Projeto arquivado'); onBack(); onNotify('Projeto arquivado.'); }} className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10">{confirmProjectDelete ? 'Confirmar arquivamento' : 'Arquivar projeto'}</button></div></section>}
    </div>
  );
}

function DialogShell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#131313] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><h2 id="project-dialog-title" className="text-lg font-semibold text-white">{title}</h2>{subtitle && <p className="mt-1 text-xs text-[#A1A1AA]">{subtitle}</p>}</div><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-[#71717A] hover:text-white" aria-label="Fechar">×</button></div>{children}</section></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[#D4D4D8]">{label}<div className="mt-1.5">{children}</div></label>;
}

function MenuButton({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-white/[0.06] ${danger ? 'text-red-300' : 'text-[#D4D4D8]'}`}>{children}</button>;
}
