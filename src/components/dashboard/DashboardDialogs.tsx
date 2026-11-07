import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock3, X } from 'lucide-react';
import type { DashboardProject, DashboardTask, DailyMission, TaskPriority } from './types';

const fieldClass = 'mt-1.5 w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[#52525B] focus:border-[#F59E0B]/50';
const labelClass = 'block text-xs font-medium text-[#D4D4D8]';
const selectClass = `${fieldClass} appearance-none`;

const DialogFrame: React.FC<{ title: string; description?: string; onClose: () => void; children: React.ReactNode }> = ({ title, description, onClose, children }) => {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="dashboard-dialog-title" className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#131313] p-5 shadow-2xl shadow-black/50 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="dashboard-dialog-title" className="text-lg font-semibold text-white">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#71717A] hover:bg-white/5 hover:text-white" aria-label="Fechar"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </section>
    </div>
  );
};

function ProjectSelect({ projects, value, onChange, allowNone = true }: {
  projects: DashboardProject[];
  value: string;
  onChange: (value: string) => void;
  allowNone?: boolean;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
      {allowNone && <option value="">Sem projeto</option>}
      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
  );
}

export const MissionDialog: React.FC<{
  mission: DailyMission | null;
  projects: DashboardProject[];
  onClose: () => void;
  onSave: (mission: Omit<DailyMission, 'day'>) => void;
}> = ({ mission, projects, onClose, onSave }) => {
  const [title, setTitle] = useState(mission?.title || '');
  const [projectId, setProjectId] = useState(mission?.projectId || '');
  const [dueAt, setDueAt] = useState(mission?.dueAt || '');
  return (
    <DialogFrame title={mission ? 'Editar missão' : 'Definir missão'} description="Escolha uma entrega que faria o seu dia valer a pena." onClose={onClose}>
      <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); onSave({ title: title.trim(), projectId, dueAt, completed: mission?.completed ?? false }); }}>
        <label className={labelClass}>Minha missão<input autoFocus required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Qual resultado importa hoje?" className={fieldClass} /></label>
        <label className={labelClass}>Projeto relacionado<ProjectSelect projects={projects} value={projectId} onChange={setProjectId} /></label>
        <label className={labelClass}>Prazo (opcional)<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className={fieldClass} /></label>
        <DialogActions submitLabel="Salvar missão" onClose={onClose} />
      </form>
    </DialogFrame>
  );
};

export const TaskDialog: React.FC<{
  task: DashboardTask | null;
  tasks: DashboardTask[];
  projects: DashboardProject[];
  onClose: () => void;
  onSave: (task: Pick<DashboardTask, 'title' | 'projectId' | 'priority' | 'dependsOnId' | 'estimatedMinutes' | 'dueAt' | 'scheduledAt'>) => void;
}> = ({ task, tasks, projects, onClose, onSave }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [projectId, setProjectId] = useState(task?.projectId || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'Média');
  const [dependsOnId, setDependsOnId] = useState(task?.dependsOnId || '');
  const [estimate, setEstimate] = useState(String(task?.estimatedMinutes || 25));
  const [dueAt, setDueAt] = useState(task?.dueAt || '');
  const [scheduledAt, setScheduledAt] = useState(task?.scheduledAt || '');
  const dependencies = tasks.filter((candidate) => {
    if (candidate.id === task?.id) return false;
    const visited = new Set<string>();
    let dependencyId = candidate.id;
    while (dependencyId) {
      if (dependencyId === task?.id || visited.has(dependencyId)) return false;
      visited.add(dependencyId);
      dependencyId = tasks.find((item) => item.id === dependencyId)?.dependsOnId || '';
    }
    return true;
  });
  return (
    <DialogFrame title={task ? 'Editar prioridade' : 'Nova prioridade'} description="Planeje até três prioridades principais para hoje." onClose={onClose}>
      <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); onSave({ title: title.trim(), projectId, priority, dependsOnId, estimatedMinutes: Math.max(1, Number(estimate)), dueAt, scheduledAt }); }}>
        <label className={labelClass}>Tarefa<input autoFocus required maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="O que você precisa fazer?" className={fieldClass} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Prioridade<select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} className={selectClass}><option>Alta</option><option>Média</option><option>Baixa</option></select></label>
          <label className={labelClass}>Tempo estimado (min)<input type="number" min="1" max="1440" required value={estimate} onChange={(event) => setEstimate(event.target.value)} className={fieldClass} /></label>
        </div>
        <label className={labelClass}>Projeto<ProjectSelect projects={projects} value={projectId} onChange={setProjectId} /></label>
        <label className={labelClass}>Depende de (opcional)<select value={dependsOnId} onChange={(event) => setDependsOnId(event.target.value)} className={selectClass}><option value="">Nenhuma dependência</option>{dependencies.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Horário previsto<input type="time" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className={fieldClass} /></label>
          <label className={labelClass}>Prazo<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className={fieldClass} /></label>
        </div>
        <DialogActions submitLabel={task ? 'Salvar alterações' : 'Adicionar prioridade'} onClose={onClose} />
      </form>
    </DialogFrame>
  );
};

export const ProjectDialog: React.FC<{
  onClose: () => void;
  onSave: (project: Pick<DashboardProject, 'name' | 'description' | 'dueAt'>) => void;
}> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  return (
    <DialogFrame title="Criar projeto" description="Adicione um projeto real para organizar suas tarefas." onClose={onClose}>
      <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); onSave({ name: name.trim(), description: description.trim(), dueAt }); }}>
        <label className={labelClass}>Nome do projeto<input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do projeto" className={fieldClass} /></label>
        <label className={labelClass}>Descrição curta (opcional)<input maxLength={160} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="No que você está trabalhando?" className={fieldClass} /></label>
        <label className={labelClass}>Data prevista (opcional)<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className={fieldClass} /></label>
        <DialogActions submitLabel="Criar projeto" onClose={onClose} />
      </form>
    </DialogFrame>
  );
};

export const ScheduleDialog: React.FC<{
  onClose: () => void;
  onSave: (item: { title: string; time: string; durationMinutes: number }) => void;
}> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  return (
    <DialogFrame title="Adicionar à agenda" description="Organize um compromisso ou bloco de trabalho para hoje." onClose={onClose}>
      <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); onSave({ title: title.trim(), time, durationMinutes: Number(duration) }); }}>
        <label className={labelClass}>Atividade<input autoFocus required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome da atividade" className={fieldClass} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Horário<input type="time" required value={time} onChange={(event) => setTime(event.target.value)} className={fieldClass} /></label>
          <label className={labelClass}>Duração (min)<input type="number" min="1" max="1440" required value={duration} onChange={(event) => setDuration(event.target.value)} className={fieldClass} /></label>
        </div>
        <DialogActions submitLabel="Adicionar à agenda" onClose={onClose} />
      </form>
    </DialogFrame>
  );
};

export const IdeaDialog: React.FC<{
  projects: DashboardProject[];
  onClose: () => void;
  onSave: (idea: { text: string; link: string; category: string; projectId: string; attachmentName?: string; attachmentData?: string }) => void;
}> = ({ projects, onClose, onSave }) => {
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('Geral');
  const [projectId, setProjectId] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; data: string } | null>(null);
  const [attachmentError, setAttachmentError] = useState('');

  const readAttachment = (file?: File) => {
    setAttachmentError('');
    if (!file) {
      setAttachment(null);
      return;
    }
    if (file.size > 1_000_000) {
      setAttachmentError('O arquivo deve ter no máximo 1 MB para ser salvo neste navegador.');
      setAttachment(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setAttachmentError('Não foi possível ler este arquivo.');
        return;
      }
      setAttachment({ name: file.name, data: reader.result });
    };
    reader.onerror = () => setAttachmentError('Não foi possível ler este arquivo.');
    reader.readAsDataURL(file);
  };

  return (
    <DialogFrame title="Capturar ideia" description="Registre agora e volte ao que estava fazendo. A ideia fica salva neste navegador." onClose={onClose}>
      <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); onSave({ text: text.trim(), link: link.trim(), category, projectId, attachmentName: attachment?.name, attachmentData: attachment?.data }); }}>
        <label className={labelClass}>Ideia<textarea autoFocus required maxLength={2000} rows={4} value={text} onChange={(event) => setText(event.target.value)} placeholder="Anote antes que escape..." className={`${fieldClass} resize-y`} /></label>
        <label className={labelClass}>Link (opcional)<input type="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://" className={fieldClass} /></label>
        <label className={labelClass}>Imagem ou arquivo (opcional, até 1 MB)<input type="file" onChange={(event) => readAttachment(event.target.files?.[0])} className={`${fieldClass} file:mr-3 file:border-0 file:bg-transparent file:text-xs file:text-[#FBBF24]`} /></label>
        {attachment && <p className="text-[11px] text-[#A1A1AA]">Anexo: {attachment.name}</p>}
        {attachmentError && <p role="alert" className="text-xs text-red-300">{attachmentError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Categoria<select value={category} onChange={(event) => setCategory(event.target.value)} className={selectClass}><option>Geral</option><option>Produto</option><option>Conteúdo</option><option>Pessoal</option><option>Pesquisa</option></select></label>
          <label className={labelClass}>Projeto<ProjectSelect projects={projects} value={projectId} onChange={setProjectId} /></label>
        </div>
        <DialogActions submitLabel="Salvar ideia" onClose={onClose} />
      </form>
    </DialogFrame>
  );
};

export const FocusDialog: React.FC<{
  tasks: DashboardTask[];
  initialTaskId?: string;
  focusGoalMinutes: number;
  onClose: () => void;
  onStart: (options: { taskId: string | null; mode: string; durationMinutes: number | null }) => void;
}> = ({ tasks, initialTaskId, focusGoalMinutes, onClose, onStart }) => {
  const [taskId, setTaskId] = useState(initialTaskId || '');
  const [mode, setMode] = useState('Pomodoro');
  const [custom, setCustom] = useState('30');
  const durationForMode: Record<string, number | null> = { Pomodoro: 25, 'Deep Focus': 50, Sprint: 15, Personalizado: Number(custom), Cronômetro: null };
  return (
    <DialogFrame title="Preparar sessão de foco" description={`Meta diária: ${focusGoalMinutes} minutos. Escolha um bloco e, se quiser, uma tarefa.`} onClose={onClose}>
      <form className="mt-5 space-y-5" onSubmit={(event) => { event.preventDefault(); onStart({ taskId: taskId || null, mode, durationMinutes: durationForMode[mode] }); }}>
        <div>
          <p className={labelClass}>Modo de foco</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {['Pomodoro', 'Deep Focus', 'Sprint', 'Personalizado', 'Cronômetro'].map((item) => (
              <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-lg border px-3 py-2.5 text-xs transition-colors ${mode === item ? 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FBBF24]' : 'border-white/10 text-[#A1A1AA] hover:text-white'}`}>
                {item}<span className="mt-1 block text-[10px] opacity-70">{item === 'Pomodoro' ? '25 min' : item === 'Deep Focus' ? '50 min' : item === 'Sprint' ? '15 min' : item === 'Cronômetro' ? 'Sem limite' : 'Defina o tempo'}</span>
              </button>
            ))}
          </div>
        </div>
        {mode === 'Personalizado' && <label className={labelClass}>Duração em minutos<input type="number" min="1" max="240" required value={custom} onChange={(event) => setCustom(event.target.value)} className={fieldClass} /></label>}
        <label className={labelClass}>Tarefa (opcional)<select value={taskId} onChange={(event) => setTaskId(event.target.value)} className={selectClass}><option value="">Foco livre</option>{tasks.filter((task) => !task.completed).map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
        <div className="rounded-lg bg-white/[0.035] p-3 text-xs leading-5 text-[#A1A1AA]"><Clock3 className="mr-1.5 inline h-3.5 w-3.5 text-[#F59E0B]" />A sessão continua contando corretamente se você trocar de página ou atualizar o navegador.</div>
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2.5 text-xs text-[#A1A1AA] hover:text-white">Cancelar</button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">Iniciar foco <ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
      </form>
    </DialogFrame>
  );
};

export const RecoveryDialog: React.FC<{
  nextTask?: DashboardTask;
  onClose: () => void;
}> = ({ nextTask, onClose }) => {
  const situations = [
    'Tenho muitos projetos e não sei por onde começar.',
    'Sei o que preciso fazer, mas não consigo começar.',
    'Estou pulando de tarefa em tarefa.',
    'Esqueci o que precisava fazer.',
    'Já perdi boa parte do dia.',
  ];
  const [situation, setSituation] = useState('');
  const recommendation = situation.includes('projetos')
    ? nextTask ? `Deixe os outros projetos em espera por enquanto. Abra “${nextTask.title}” e trabalhe nela por 5 minutos.` : 'Escreva suas tarefas em um só lugar e escolha uma prioridade para começar.'
    : situation.includes('começar')
      ? nextTask ? `Abra “${nextTask.title}” e faça apenas o primeiro passo por 5 minutos. Não precisa terminar.` : 'Escolha uma tarefa e reduza-a a uma ação que leve menos de 5 minutos.'
      : situation.includes('pulando')
        ? nextTask ? `Pause as outras tarefas. Volte para “${nextTask.title}” e mantenha uma única janela aberta por 10 minutos.` : 'Feche as distrações, escolha uma tarefa e faça um bloco de foco curto.'
        : situation.includes('Esqueci')
          ? 'Anote tudo o que está ocupando sua cabeça. Depois, escolha uma única próxima ação e registre como prioridade.'
          : 'Não tente recuperar o dia inteiro. Escolha um pequeno passo, reserve 5 minutos e encerre o dia com clareza.';
  return (
    <DialogFrame title="Vamos recuperar o foco." description="Escolha o que está acontecendo. Vamos encontrar um próximo passo possível, sem alterar sua agenda." onClose={onClose}>
      <div className="mt-5 space-y-2">
        {situations.map((item) => (
          <button key={item} type="button" onClick={() => setSituation(item)} className={`w-full rounded-lg border px-3 py-3 text-left text-xs leading-5 transition-colors ${situation === item ? 'border-[#F59E0B]/35 bg-[#F59E0B]/[0.07] text-[#FBBF24]' : 'border-white/[0.08] text-[#D4D4D8] hover:border-white/15 hover:bg-white/[0.025]'}`}>
            {item}
          </button>
        ))}
      </div>
      {situation && <p className="mt-4 rounded-xl border border-[#F59E0B]/15 bg-[#F59E0B]/[0.04] p-4 text-sm leading-6 text-[#E4E4E7]">{recommendation}</p>}
      <div className="mt-5 flex justify-end border-t border-white/[0.07] pt-4">
        <button type="button" onClick={onClose} className="rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">{situation ? 'Voltar para o dia' : 'Fechar'}</button>
      </div>
    </DialogFrame>
  );
};

function DialogActions({ submitLabel, onClose }: { submitLabel: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] pt-4">
      <button type="button" onClick={onClose} className="rounded-lg px-3 py-2.5 text-xs text-[#A1A1AA] hover:text-white">Cancelar</button>
      <button type="submit" className="rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#FBBF24]">{submitLabel}</button>
    </div>
  );
}
