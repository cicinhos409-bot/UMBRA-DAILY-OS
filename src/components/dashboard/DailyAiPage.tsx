import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, Check, Clock3, FolderKanban,
  Lightbulb, ListChecks, MessageSquarePlus,
  PanelRightClose, PanelRightOpen, Pencil, Plus, Search, Send, Sparkles, Target,
  Trash2, TriangleAlert,
} from 'lucide-react';
import { localDateKey } from './dashboardService';
import {
  createDailyAiConversation, createDailyAiMessage, dailyAiService,
  type DailyAiActionId, type DailyAiConversation,
} from './dailyAiService';
import type { DashboardState, DashboardTask } from './types';

interface DailyAiPageProps {
  data: DashboardState;
  initialAction?: string;
  onClearInitialAction: () => void;
  onOpenTask: (taskId: string) => void;
  onOpenProject: (projectId: string) => void;
  onOpenIdeas: () => void;
  onStartFocus: (task: DashboardTask) => void;
  onApprovePriorities: (taskIds: string[]) => void;
  onNotify: (message: string) => void;
}

const actions: { id: DailyAiActionId; title: string; description: string }[] = [
  { id: 'organize_day', title: 'Organizar meu dia', description: 'Ver missão, prioridades e tempo disponível' },
  { id: 'prioritize_tasks', title: 'Priorizar tarefas', description: 'Ordenar pendências com motivos claros' },
  { id: 'recover_focus', title: 'Estou perdido', description: 'Encontrar uma próxima ação possível' },
  { id: 'split_task', title: 'Dividir uma tarefa grande', description: 'Preparar uma tarefa para decomposição' },
  { id: 'replan_day', title: 'Replanejar meu dia', description: 'Rever o que ainda cabe hoje' },
  { id: 'productivity', title: 'Analisar minha produtividade', description: 'Consultar registros reais de execução' },
  { id: 'organize_ideas', title: 'Organizar minhas ideias', description: 'Revisar itens recentes do Cofre' },
  { id: 'plan_project', title: 'Planejar um projeto', description: 'Revisar projetos e fases existentes' },
  { id: 'next_action', title: 'Encontrar minha próxima ação', description: 'Escolher um primeiro passo concreto' },
  { id: 'review_projects', title: 'Revisar meus projetos', description: 'Ver andamento, prazos e tarefas' },
];

const recoverySituations = [
  'Tenho muitos projetos e não sei por onde começar.',
  'Sei o que preciso fazer, mas não consigo começar.',
  'Estou pulando de tarefa em tarefa.',
  'Esqueci o que precisava fazer.',
  'Já perdi boa parte do dia.',
];

const card = 'rounded-2xl border border-white/[0.08] bg-[#101010]';
const field = 'w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#F59E0B]/50';

function taskIsOpen(task: DashboardTask): boolean {
  return !task.archivedAt && task.status !== 'Concluído' && !task.completed;
}

function dateLabel(value: string): string {
  if (!value) return 'Sem prazo';
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function timeLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

function getTaskReason(task: DashboardTask, data: DashboardState, today: string): string {
  if (task.dueAt && task.dueAt < today) return 'Está atrasada.';
  if (task.dueAt === today) return 'O prazo é hoje.';
  if (task.dependsOnId && data.tasks.some((item) => item.id === task.id && taskIsOpen(item))) {
    const dependency = data.tasks.find((item) => item.id === task.dependsOnId);
    if (dependency && taskIsOpen(dependency)) return `Depende primeiro de “${dependency.title}”.`;
  }
  if (task.priority === 'Urgente') return 'Marcada como urgente.';
  if (task.priority === 'Alta') return 'Marcada com prioridade alta.';
  if (task.projectId) {
    const project = data.projects.find((item) => item.id === task.projectId);
    if (project?.priority === 'Urgente' || project?.priority === 'Alta') return `Vinculada ao projeto prioritário “${project.name}”.`;
  }
  if (task.dueAt) return `Prazo em ${dateLabel(task.dueAt)}.`;
  return `Prioridade ${task.priority.toLocaleLowerCase('pt-BR')}, sem prazo cadastrado.`;
}

function rankTasks(data: DashboardState): DashboardTask[] {
  const today = localDateKey();
  const tomorrow = localDateKey(new Date(Date.now() + 86_400_000));
  const score = (task: DashboardTask) => {
    let value = task.priority === 'Urgente' ? 45 : task.priority === 'Alta' ? 30 : task.priority === 'Média' ? 15 : 0;
    if (task.dueAt && task.dueAt < today) value += 100;
    else if (task.dueAt === today) value += 75;
    else if (task.dueAt === tomorrow) value += 45;
    if (data.dailyPriorityIds.includes(task.id)) value += 35;
    if (task.dependsOnId) {
      const dependency = data.tasks.find((item) => item.id === task.dependsOnId);
      if (dependency && !taskIsOpen(dependency)) value += 10;
    }
    const project = data.projects.find((item) => item.id === task.projectId);
    if (project?.priority === 'Urgente') value += 20;
    else if (project?.priority === 'Alta') value += 12;
    return value;
  };
  return data.tasks.filter(taskIsOpen).sort((a, b) => score(b) - score(a) || a.createdAt - b.createdAt);
}

function productivitySummary(data: DashboardState, period: 1 | 7 | 30): string[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (period - 1));
  const startTime = start.getTime();
  const completedEvents = data.tasks.flatMap((task) => task.history)
    .filter((entry) => entry.action.toLocaleLowerCase('pt-BR').includes('conclu') && entry.createdAt >= startTime).length;
  const focusSessions = data.focusHistory.filter((session) => session.startedAt >= startTime);
  const focusSeconds = focusSessions.reduce((total, session) => total + (session.actualFocusSeconds ?? session.durationMinutes * 60), 0);
  const openTasks = data.tasks.filter(taskIsOpen).length;
  const lateTasks = data.tasks.filter((task) => taskIsOpen(task) && task.dueAt && task.dueAt < localDateKey()).length;
  const completedProjects = data.projects.filter((project) => project.status === 'Concluído' && project.createdAt >= startTime).length;
  const focusLabel = focusSeconds >= 3600
    ? `${Math.floor(focusSeconds / 3600)}h ${Math.floor((focusSeconds % 3600) / 60)}min`
    : `${Math.floor(focusSeconds / 60)} min`;
  return [
    `${completedEvents} conclusão(ões) registrada(s) nas atividades das tarefas.`,
    `${focusSessions.length} sessão(ões) de foco registrada(s), somando ${focusLabel}.`,
    `${openTasks} tarefa(s) em aberto agora${lateTasks ? `, sendo ${lateTasks} atrasada(s)` : ''}.`,
    `${completedProjects} projeto(s) concluído(s) no período, conforme a data de criação registrada.`,
  ];
}

function groupLabel(timestamp: number): 'Hoje' | 'Ontem' | 'Últimos 7 dias' | 'Mais antigas' {
  const now = new Date();
  const date = new Date(timestamp);
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.floor((day - itemDay) / 86_400_000);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return 'Últimos 7 dias';
  return 'Mais antigas';
}

function LocalAnalysis({ action, data, onOpenTask, onOpenProject, onOpenIdeas, onStartFocus, onApprovePriorities, onNotify }: {
  action: DailyAiActionId;
  data: DashboardState;
  onOpenTask: (taskId: string) => void;
  onOpenProject: (projectId: string) => void;
  onOpenIdeas: () => void;
  onStartFocus: (task: DashboardTask) => void;
  onApprovePriorities: (taskIds: string[]) => void;
  onNotify: (message: string) => void;
}) {
  const today = localDateKey();
  const openTasks = useMemo(() => rankTasks(data), [data]);
  const currentPriorities = data.dailyPriorityIds
    .map((id) => data.tasks.find((task) => task.id === id))
    .filter((task): task is DashboardTask => Boolean(task && taskIsOpen(task)));
  const activeProjects = data.projects.filter((project) => !project.archivedAt && (project.status === 'Ativo' || project.status === 'Em andamento'));
  const recentIdeas = data.ideas
    .filter((idea) => idea.status !== 'trash' && idea.status !== 'archived')
    .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
    .slice(0, 5);
  const overdue = openTasks.filter((task) => task.dueAt && task.dueAt < today);
  const dueToday = openTasks.filter((task) => task.dueAt === today);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => currentPriorities.slice(0, 3).map((task) => task.id));
  const [recoveryChoice, setRecoveryChoice] = useState('');
  const [period, setPeriod] = useState<1 | 7 | 30>(7);
  const [selectedTaskId, setSelectedTaskId] = useState(openTasks[0]?.id || '');
  const [objective, setObjective] = useState('');
  const recommended = openTasks[0];

  const chooseRecovery = (situation: string) => setRecoveryChoice(situation);
  const recoveryTask = recoveryChoice === recoverySituations[0]
    ? openTasks.find((task) => task.projectId && activeProjects.some((project) => project.id === task.projectId)) || recommended
    : recoveryChoice === recoverySituations[3]
      ? currentPriorities[0] || recommended
      : recommended;

  if (action === 'organize_day' || action === 'replan_day') {
    const chosen = selectedIds.map((id) => openTasks.find((task) => task.id === id)).filter((task): task is DashboardTask => Boolean(task)).slice(0, 3);
    const availableMinutes = chosen.reduce((total, task) => total + (Number.isFinite(task.estimatedMinutes) ? Math.max(0, task.estimatedMinutes) : 0), 0);
    const unestimated = chosen.filter((task) => !Number.isFinite(task.estimatedMinutes) || task.estimatedMinutes <= 0).length;
    return (
      <section className={`${card} mt-4 p-4 sm:p-5`}>
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-[#F59E0B]/10 p-2 text-[#FBBF24]"><Target className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{data.mission?.title || 'Missão ainda não definida'}</p>
            <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">
              {data.mission?.title ? 'Missão atual registrada no dashboard.' : 'Defina uma missão no dashboard para dar direção ao plano.'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#A1A1AA]">
          <span className="rounded-full border border-white/10 px-2.5 py-1">{openTasks.length} tarefa(s) em aberto</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1">{overdue.length} atrasada(s)</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1">{dueToday.length} com prazo hoje</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1">{data.schedule.filter((item) => item.day === today && !item.completed).length} compromisso(s) cadastrado(s)</span>
        </div>
        {(overdue.length > 0 || dueToday.length > 0) && (
          <div className="mt-4 space-y-1.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3 text-xs text-[#D4D4D8]">
            {overdue.length > 0 && <p><TriangleAlert className="mr-1.5 inline h-3.5 w-3.5 text-amber-300" />{overdue.length} tarefa(s) atrasada(s) exigem revisão.</p>}
            {dueToday.length > 0 && <p>{dueToday.length} tarefa(s) têm prazo hoje.</p>}
          </div>
        )}
        <p className="mt-4 text-[11px] font-medium text-[#A1A1AA]">Selecione até três tarefas para priorizar. A ordem abaixo é uma sugestão local.</p>
        <div className="mt-2 space-y-2">
          {openTasks.slice(0, 8).map((task) => {
            const checked = selectedIds.includes(task.id);
            return (
              <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] p-3 transition-colors hover:border-white/15">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setSelectedIds((ids) => checked ? ids.filter((id) => id !== task.id) : ids.length < 3 ? [...ids, task.id] : ids)}
                  className="mt-0.5 accent-[#F59E0B]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-white">{task.title}</span>
                  <span className="mt-1 block text-[10px] leading-4 text-[#71717A]">{getTaskReason(task, data, today)} {task.estimatedMinutes > 0 ? `Estimativa: ${timeLabel(task.estimatedMinutes)}.` : 'Sem estimativa.'}</span>
                </span>
                <span className="shrink-0 text-[10px] text-[#A1A1AA]">{dateLabel(task.dueAt)}</span>
              </label>
            );
          })}
          {openTasks.length === 0 && <p className="rounded-xl border border-white/[0.07] p-3 text-xs text-[#71717A]">Não há tarefas pendentes registradas.</p>}
        </div>
        <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-3 text-xs leading-5 text-[#A1A1AA]">
          <p className="font-medium text-white">Planejamento sugerido</p>
          {chosen.length ? (
            <ol className="mt-2 space-y-1.5">
              {chosen.map((task, index) => <li key={task.id}>{index + 1}. {task.title} — {task.estimatedMinutes > 0 ? timeLabel(task.estimatedMinutes) : 'tempo não estimado'}</li>)}
            </ol>
          ) : <p className="mt-2">Selecione tarefas para montar uma proposta. Horários não foram preenchidos porque não há disponibilidade completa cadastrada.</p>}
          {chosen.length > 0 && <p className="mt-2">Tempo estimado total: {timeLabel(availableMinutes)}{unestimated ? `, além de ${unestimated} atividade(s) sem estimativa` : ''}. Reserve intervalos para pausas; nenhum horário foi inventado.</p>}
          {data.schedule.some((item) => item.day === today && !item.completed) && <p className="mt-2">A agenda cadastrada não foi reorganizada nem usada para deslocar compromissos.</p>}
        </div>
        <button type="button" disabled={!chosen.length} onClick={() => { onApprovePriorities(chosen.map((task) => task.id)); onNotify('Prioridades aplicadas ao dashboard após sua aprovação.'); }} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-3.5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#FBBF24] disabled:cursor-not-allowed disabled:opacity-40">
          <Check className="h-3.5 w-3.5" /> Aprovar prioridades no dashboard
        </button>
      </section>
    );
  }

  if (action === 'prioritize_tasks') {
    return (
      <section className={`${card} mt-4 p-4 sm:p-5`}>
        <h3 className="text-sm font-semibold text-white">Recomendação baseada nas tarefas registradas</h3>
        <p className="mt-1 text-xs leading-5 text-[#71717A]">A ordem considera prazo, prioridade definida e vínculos existentes. Prioridade alta não é tratada como sinônimo de urgência.</p>
        <div className="mt-3 space-y-2">
          {openTasks.slice(0, 5).map((task, index) => (
            <button key={task.id} type="button" onClick={() => onOpenTask(task.id)} className="flex w-full items-start gap-3 rounded-xl border border-white/[0.07] p-3 text-left hover:border-[#F59E0B]/30">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] text-[#FBBF24]">{index + 1}</span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-white">{task.title}</span><span className="mt-1 block text-[10px] leading-4 text-[#A1A1AA]">{getTaskReason(task, data, today)}</span></span>
              <span className="text-[10px] text-[#71717A]">{dateLabel(task.dueAt)}</span>
            </button>
          ))}
          {!openTasks.length && <p className="text-xs text-[#71717A]">Nenhuma tarefa em aberto para ordenar.</p>}
        </div>
        {openTasks.length > 0 && <button type="button" onClick={() => { onApprovePriorities(openTasks.slice(0, 3).map((task) => task.id)); onNotify('As três primeiras recomendações foram aplicadas às prioridades do dia.'); }} className="mt-4 rounded-lg bg-[#F59E0B] px-3.5 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">Aplicar três primeiras recomendações</button>}
      </section>
    );
  }

  if (action === 'recover_focus') {
    const firstStep = recoveryChoice === recoverySituations[1]
      ? 'Abra a tarefa e escreva apenas o que precisa estar pronto. Trabalhe cinco minutos nesse primeiro passo.'
      : recoveryChoice === recoverySituations[3]
        ? 'Revise sua missão do dia e escolha somente uma tarefa entre as prioridades cadastradas.'
        : recoveryChoice === recoverySituations[4]
          ? 'Escolha uma tarefa pendente com prazo ou prioridade relevante; deixe o restante para uma revisão posterior.'
          : 'Escolha uma tarefa pendente vinculada a um projeto ativo e avance uma etapa pequena.';
    return (
      <section className={`${card} mt-4 p-4 sm:p-5`}>
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#FBBF24]" /><h3 className="text-sm font-semibold text-white">Modo Recuperar Foco</h3></div>
        <p className="mt-1 text-xs text-[#A1A1AA]">Respire. Vamos colocar as coisas em ordem. Não precisamos resolver tudo agora. Precisamos descobrir o próximo passo.</p>
        <div className="mt-4 flex flex-wrap gap-2">{recoverySituations.map((item) => <button key={item} type="button" onClick={() => chooseRecovery(item)} className={`rounded-full border px-3 py-2 text-left text-[10px] transition-colors ${recoveryChoice === item ? 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FBBF24]' : 'border-white/10 text-[#A1A1AA] hover:text-white'}`}>{item}</button>)}</div>
        {recoveryChoice && (
          <div className="mt-4 rounded-xl border border-[#F59E0B]/15 bg-[#F59E0B]/[0.04] p-4">
            <p className="text-xs font-semibold text-[#FBBF24]">Próxima ação sugerida</p>
            {recoveryTask ? (
              <>
                <button type="button" onClick={() => onOpenTask(recoveryTask.id)} className="mt-2 block text-left text-sm font-medium text-white hover:text-[#FBBF24]">{recoveryTask.title}</button>
                <p className="mt-1 text-[11px] text-[#A1A1AA]">{getTaskReason(recoveryTask, data, today)}</p>
                <p className="mt-3 text-xs leading-5 text-[#D4D4D8]">{firstStep}</p>
                <p className="mt-2 text-[10px] text-[#71717A]">Reserve cinco minutos para começar. Essa é uma sugestão baseada apenas nos registros disponíveis.</p>
                <button type="button" onClick={() => onStartFocus(recoveryTask)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-3.5 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">Começar no Focus Mode <ArrowRight className="h-3.5 w-3.5" /></button>
              </>
            ) : <p className="mt-2 text-xs leading-5 text-[#A1A1AA]">Não há tarefa pendente cadastrada. Registre uma tarefa no Gerenciador antes de começar; não vou inventar uma atividade.</p>}
          </div>
        )}
      </section>
    );
  }

  if (action === 'split_task') {
    const task = data.tasks.find((item) => item.id === selectedTaskId && taskIsOpen(item));
    return (
      <section className={`${card} mt-4 p-4 sm:p-5`}>
        <h3 className="text-sm font-semibold text-white">Preparar divisão de tarefa</h3>
        <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">Selecione uma tarefa existente para revisar seu contexto. A proposta automática de etapas requer um provedor de IA no backend, que ainda não está configurado.</p>
        <select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)} className={`${field} mt-4`}>
          <option value="">Selecione uma tarefa</option>
          {openTasks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        {task && <div className="mt-3 rounded-xl border border-white/[0.07] p-3"><p className="text-xs font-medium text-white">{task.title}</p><p className="mt-1 text-[11px] leading-5 text-[#A1A1AA]">{task.description || 'Esta tarefa não possui descrição cadastrada.'}</p><p className="mt-2 text-[10px] text-[#71717A]">Prazo: {dateLabel(task.dueAt)} · Estimativa: {task.estimatedMinutes ? timeLabel(task.estimatedMinutes) : 'não informada'}</p></div>}
        <button type="button" disabled={!task} onClick={() => task && onOpenTask(task.id)} className="mt-4 rounded-lg border border-white/10 px-3.5 py-2.5 text-xs text-white hover:border-[#F59E0B]/30 disabled:opacity-40">Abrir tarefa existente</button>
      </section>
    );
  }

  if (action === 'productivity') {
    const summary = productivitySummary(data, period);
    return (
      <section className={`${card} mt-4 p-4 sm:p-5`}>
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-white">Registros de execução</h3><p className="mt-1 text-[10px] text-[#71717A]">Indicadores objetivos; não inferimos “tempo perdido” sem dados registrados.</p></div><select aria-label="Período do relatório" value={period} onChange={(event) => setPeriod(Number(event.target.value) as 1 | 7 | 30)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-2 py-2 text-xs text-white"><option value={1}>Hoje</option><option value={7}>7 dias</option><option value={30}>30 dias</option></select></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{summary.map((line) => <div key={line} className="rounded-xl border border-white/[0.07] p-3 text-xs leading-5 text-[#D4D4D8]"><Activity className="mr-1.5 inline h-3.5 w-3.5 text-[#FBBF24]" />{line}</div>)}</div>
        {!data.focusHistory.length && <p className="mt-3 text-[10px] text-[#71717A]">Ainda não há histórico de foco suficiente para identificar padrões.</p>}
      </section>
    );
  }

  if (action === 'organize_ideas') {
    return (
      <section className={`${card} mt-4 p-4 sm:p-5`}>
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-white">Ideias recentes no Cofre</h3><p className="mt-1 text-[10px] text-[#71717A]">Nenhum item foi editado, resumido ou convertido.</p></div><button type="button" onClick={onOpenIdeas} className="text-xs text-[#FBBF24] hover:text-white">Abrir Cofre</button></div>
        <div className="mt-3 space-y-2">{recentIdeas.map((idea) => <div key={idea.id} className="rounded-xl border border-white/[0.07] p-3"><p className="text-xs font-medium text-white">{idea.title?.trim() || idea.text.split(/\s+/).slice(0, 12).join(' ') || 'Ideia sem título'}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#A1A1AA]">{idea.text || idea.link || 'Sem conteúdo descritivo.'}</p><p className="mt-2 text-[10px] text-[#71717A]">{idea.category || 'Sem categoria'}{idea.favorite ? ' · Favorita' : ''}</p></div>)}
          {!recentIdeas.length && <p className="text-xs text-[#71717A]">O Cofre ainda não contém ideias disponíveis.</p>}
        </div>
        <p className="mt-3 text-[10px] text-[#71717A]">Sugestões de categoria, resumo e semelhança exigem IA real e serão apresentadas sem alterar a ideia original.</p>
      </section>
    );
  }

  if (action === 'plan_project') {
    return (
      <section className={`${card} mt-4 p-4 sm:p-5`}>
        <h3 className="text-sm font-semibold text-white">Planejamento de projeto</h3>
        <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">Reveja os projetos já cadastrados ou anote um objetivo. A geração de fases e tarefas depende de IA no backend; nada será criado automaticamente.</p>
        <input value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={300} placeholder="Descreva um objetivo (não será enviado)" className={`${field} mt-3`} />
        <div className="mt-3 space-y-2">{activeProjects.slice(0, 5).map((project) => <button type="button" key={project.id} onClick={() => onOpenProject(project.id)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] p-3 text-left hover:border-[#F59E0B]/30"><span><span className="block text-xs font-medium text-white">{project.name}</span><span className="mt-1 block text-[10px] text-[#71717A]">{project.status} · Prioridade {project.priority.toLocaleLowerCase('pt-BR')}{project.dueAt ? ` · prazo ${dateLabel(project.dueAt)}` : ''}</span></span><ArrowUpRight className="h-3.5 w-3.5 text-[#A1A1AA]" /></button>)}
          {!activeProjects.length && <p className="text-xs text-[#71717A]">Nenhum projeto ativo foi encontrado.</p>}
        </div>
        {objective && <p className="mt-3 text-[10px] text-[#71717A]">Rascunho mantido somente nesta conversa enquanto ela permanecer aberta. O histórico é armazenado localmente.</p>}
      </section>
    );
  }

  if (action === 'next_action') {
    return (
      <section className={`${card} mt-4 p-4 sm:p-5`}>
        <h3 className="text-sm font-semibold text-white">Uma próxima ação</h3>
        {recommended ? <>
          <p className="mt-2 text-lg font-medium text-white">{recommended.title}</p>
          <p className="mt-2 text-xs leading-5 text-[#A1A1AA]">{getTaskReason(recommended, data, today)} {recommended.estimatedMinutes ? `A estimativa cadastrada é ${timeLabel(recommended.estimatedMinutes)}.` : 'O tempo necessário não foi estimado.'}</p>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onStartFocus(recommended)} className="rounded-lg bg-[#F59E0B] px-3.5 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">Começar no Focus Mode</button><button type="button" onClick={() => onOpenTask(recommended.id)} className="rounded-lg border border-white/10 px-3.5 py-2.5 text-xs text-white hover:border-white/20">Abrir tarefa</button></div>
        </> : <p className="mt-2 text-xs text-[#A1A1AA]">Não há tarefas pendentes registradas. Crie uma tarefa no Gerenciador para obter uma recomendação baseada em dados.</p>}
      </section>
    );
  }

  const projectTasks = (projectId: string) => data.tasks.filter((task) => task.projectId === projectId && !task.archivedAt);
  return (
    <section className={`${card} mt-4 p-4 sm:p-5`}>
      <h3 className="text-sm font-semibold text-white">Revisão de projetos ativos</h3>
      <div className="mt-3 space-y-2">{activeProjects.map((project) => {
        const tasks = projectTasks(project.id);
        const done = tasks.filter((task) => task.status === 'Concluído').length;
        const late = tasks.filter((task) => taskIsOpen(task) && task.dueAt && task.dueAt < today).length;
        return <button type="button" key={project.id} onClick={() => onOpenProject(project.id)} className="w-full rounded-xl border border-white/[0.07] p-3 text-left hover:border-[#F59E0B]/30"><span className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-white">{project.name}</span><span className="text-[10px] text-[#A1A1AA]">{project.status}</span></span><span className="mt-2 block text-[10px] text-[#71717A]">{done}/{tasks.length} tarefa(s) concluída(s) · Prioridade {project.priority.toLocaleLowerCase('pt-BR')}{project.dueAt ? ` · prazo ${dateLabel(project.dueAt)}` : ''}{late ? ` · ${late} atrasada(s)` : ''}</span></button>;
      })}
        {!activeProjects.length && <p className="text-xs text-[#71717A]">Nenhum projeto ativo registrado.</p>}
      </div>
    </section>
  );
}

export const DailyAiPage: React.FC<DailyAiPageProps> = ({ data, initialAction, onClearInitialAction, onOpenTask, onOpenProject, onOpenIdeas, onStartFocus, onApprovePriorities, onNotify }) => {
  const [conversations, setConversations] = useState<DailyAiConversation[]>([]);
  const [activeId, setActiveId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [contextOpen, setContextOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = localDateKey();
  const activeConversation = conversations.find((item) => item.id === activeId);
  const currentPriorities = data.dailyPriorityIds
    .map((id) => data.tasks.find((task) => task.id === id))
    .filter((task): task is DashboardTask => Boolean(task && taskIsOpen(task)));
  const recommended = rankTasks(data)[0];
  const completedFocus = data.focusHistory
    .filter((session) => localDateKey(new Date(session.startedAt)) === today)
    .reduce((sum, session) => sum + (session.actualFocusSeconds ?? session.durationMinutes * 60), 0);
  const activeFocusSeconds = data.activeFocus && data.activeFocus.phase !== 'break' && data.activeFocus.mode !== 'Descanso'
    ? data.activeFocus.elapsedBeforePauseMs / 1000 + (data.activeFocus.startedAt ? (Date.now() - data.activeFocus.startedAt) / 1000 : 0)
    : 0;
  const todayFocus = completedFocus + activeFocusSeconds;
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter((conversation) => conversation.title.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
    const groups = new Map<string, DailyAiConversation[]>();
    filtered.forEach((conversation) => {
      const label = groupLabel(conversation.updatedAt);
      groups.set(label, [...(groups.get(label) || []), conversation]);
    });
    return groups;
  }, [conversations, search]);

  useEffect(() => {
    try {
      const saved = dailyAiService.load();
      setConversations(saved);
      setActiveId(saved[0]?.id || '');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Não foi possível carregar o histórico local.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || storageError) return;
    try {
      dailyAiService.save(conversations);
    } catch {
      setStorageError('Não foi possível salvar o histórico. O armazenamento do navegador pode estar cheio ou indisponível.');
    }
  }, [conversations, loaded, storageError]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeConversation?.messages.length]);

  const persist = (next: DailyAiConversation[]) => {
    setConversations(next.sort((a, b) => b.updatedAt - a.updatedAt));
    try {
      dailyAiService.save(next);
      setStorageError('');
    } catch {
      setStorageError('Não foi possível salvar o histórico. Verifique o espaço disponível no navegador.');
    }
  };

  const createConversation = () => {
    const conversation = createDailyAiConversation();
    persist([conversation, ...conversations]);
    setActiveId(conversation.id);
    setDraft('');
  };

  const appendMessages = (conversationId: string, messages: ReturnType<typeof createDailyAiMessage>[], newConversation?: DailyAiConversation) => {
    const conversationExists = conversations.some((conversation) => conversation.id === conversationId);
    const source = conversationExists ? conversations : newConversation ? [newConversation, ...conversations] : conversations;
    const next = source.map((conversation) => conversation.id === conversationId
      ? {
          ...conversation,
          title: conversation.messages.length === 0 && messages[0]?.role === 'user'
            ? messages[0].content.slice(0, 48)
            : conversation.title,
          messages: [...conversation.messages, ...messages].slice(-100),
          updatedAt: Date.now(),
        }
      : conversation);
    persist(next);
  };

  const ensureConversation = () => {
    if (activeConversation) return activeConversation;
    const conversation = createDailyAiConversation();
    persist([conversation, ...conversations]);
    setActiveId(conversation.id);
    return conversation;
  };

  const startAction = (actionId: DailyAiActionId) => {
    const action = actions.find((item) => item.id === actionId);
    const conversation = ensureConversation();
    const prompts: Record<DailyAiActionId, string> = {
      organize_day: 'Organizar meu dia',
      prioritize_tasks: 'Priorizar minhas tarefas',
      recover_focus: 'Estou perdido',
      split_task: 'Dividir uma tarefa grande',
      replan_day: 'Replanejar meu dia',
      productivity: 'Analisar minha produtividade',
      organize_ideas: 'Organizar minhas ideias',
      plan_project: 'Planejar um projeto',
      next_action: 'Encontrar minha próxima ação',
      review_projects: 'Revisar meus projetos',
    };
    const responses: Record<DailyAiActionId, string> = {
      organize_day: `Plano local preparado a partir da missão, tarefas, prioridades e agenda cadastradas. Revise as informações e aprove apenas as prioridades que quiser aplicar.`,
      prioritize_tasks: 'As tarefas abaixo são ordenadas por regras transparentes de prazo, prioridade e vínculos. Nenhuma prioridade foi alterada.',
      recover_focus: 'Respire. Vamos colocar as coisas em ordem. Escolha a situação que mais se aproxima do que está acontecendo.',
      split_task: 'Escolha uma tarefa existente. Não posso gerar etapas com IA enquanto não houver um provedor seguro configurado.',
      replan_day: 'Revise as tarefas em aberto e os compromissos cadastrados. Horários não disponíveis não serão presumidos.',
      productivity: 'Este resumo usa somente conclusões, sessões de foco e prazos registrados no navegador. Não infere tempo perdido.',
      organize_ideas: 'Estas são suas ideias recentes. Categorias, resumos e conversões não serão alterados sem uma IA real e sua aprovação.',
      plan_project: 'Consulte os projetos existentes ou registre um objetivo para planejar depois que o provedor de IA estiver configurado.',
      next_action: 'Aqui está uma tarefa pendente que se destaca nos registros disponíveis; você pode abrir ou iniciar o Focus Mode.',
      review_projects: 'A revisão abaixo resume tarefas, prazos e prioridades que já estão cadastrados.',
    };
    appendMessages(conversation.id, [
      createDailyAiMessage('user', action?.title || prompts[actionId]),
      createDailyAiMessage('assistant', `${responses[actionId]}\n\nModo local: não há IA generativa, autenticação ou backend conectados. Nenhum dado foi enviado para um provedor externo.`, actionId),
    ], conversation);
  };

  const sendMessage = () => {
    const content = draft.trim();
    if (!content) return;
    const conversation = ensureConversation();
    appendMessages(conversation.id, [
      createDailyAiMessage('user', content),
      createDailyAiMessage('assistant', 'A integração de IA real está indisponível: o projeto ainda não tem um backend autenticado conectado a um provedor. Sua mensagem e o contexto permanecem neste navegador; não vou simular uma resposta de IA. Use uma ação rápida para consultar os dados locais ou configure um backend seguro.'),
    ], conversation);
    setDraft('');
  };

  const renameConversation = (conversation: DailyAiConversation) => {
    const name = window.prompt('Novo nome para esta conversa', conversation.title)?.trim();
    if (!name) return;
    persist(conversations.map((item) => item.id === conversation.id ? { ...item, title: name.slice(0, 80), updatedAt: Date.now() } : item));
  };

  const deleteConversation = (conversation: DailyAiConversation) => {
    if (!window.confirm(`Excluir a conversa “${conversation.title}” deste navegador?`)) return;
    const next = conversations.filter((item) => item.id !== conversation.id);
    persist(next);
    if (activeId === conversation.id) setActiveId(next[0]?.id || '');
  };

  const clearHistory = () => {
    if (!window.confirm('Excluir todo o histórico local do Daily AI deste navegador?')) return;
    try {
      dailyAiService.clear();
      setConversations([]);
      setActiveId('');
      setStorageError('');
    } catch {
      setStorageError('Não foi possível limpar o histórico local.');
    }
  };

  useEffect(() => {
    if (!loaded || !initialAction) return;
    const aliases: Record<string, DailyAiActionId> = {
      'Organizar meu dia': 'organize_day',
      'Priorizar tarefas': 'prioritize_tasks',
      'Estou perdido': 'recover_focus',
      'Dividir uma tarefa': 'split_task',
      'Replanejar meu dia': 'replan_day',
      'Analisar meu progresso': 'productivity',
    };
    const actionId = aliases[initialAction] || actions.find((action) => action.title === initialAction)?.id;
    if (!actionId) {
      onClearInitialAction();
      return;
    }
    startAction(actionId);
    onClearInitialAction();
  }, [loaded, initialAction]);

  const historyList = (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71717A]">Conversas</p><button type="button" onClick={clearHistory} disabled={!conversations.length} className="text-[10px] text-[#71717A] hover:text-red-300 disabled:opacity-40">Limpar histórico</button></div>
      <label className="relative block"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar conversas" className="w-full rounded-lg border border-white/[0.07] bg-black/20 py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#52525B] focus:border-white/15" /></label>
      {(['Hoje', 'Ontem', 'Últimos 7 dias', 'Mais antigas'] as const).map((group) => {
        const items = groupedConversations.get(group) || [];
        if (!items.length) return null;
        return <section key={group}><p className="mb-1.5 text-[10px] text-[#52525B]">{group}</p><div className="space-y-1">{items.map((conversation) => <div key={conversation.id} className={`group flex items-center gap-1 rounded-lg ${activeId === conversation.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}><button type="button" onClick={() => setActiveId(conversation.id)} className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[11px] text-[#D4D4D8]">{conversation.title}</button><button type="button" onClick={() => renameConversation(conversation)} title="Renomear conversa" className="p-1 text-[#71717A] opacity-0 hover:text-white group-hover:opacity-100"><Pencil className="h-3 w-3" /></button><button type="button" onClick={() => deleteConversation(conversation)} title="Excluir conversa" className="mr-1 p-1 text-[#71717A] opacity-0 hover:text-red-300 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button></div>)}</div></section>;
      })}
      {!conversations.length && <p className="text-[11px] leading-5 text-[#71717A]">Suas conversas deste dispositivo aparecerão aqui.</p>}
    </div>
  );

  if (!loaded) return <div className={`${card} p-8 text-center text-sm text-[#A1A1AA]`}>Carregando o histórico local…</div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F59E0B]">Menos confusão. Mais execução.</p><h1 className="mt-2 text-2xl font-semibold text-white">UMBRA Daily AI</h1><p className="mt-1 text-sm text-[#A1A1AA]">Seu copiloto pessoal de execução.</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setHistoryOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8] hover:bg-white/[0.04] xl:hidden"><MessageSquarePlus className="h-3.5 w-3.5" />Histórico</button>
          <button type="button" onClick={createConversation} className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-3.5 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]"><Plus className="h-3.5 w-3.5" />Nova conversa</button>
        </div>
      </header>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.045] p-4">
        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><div><p className="text-xs font-semibold text-amber-100">Modo local — IA generativa não configurada</p><p className="mt-1 text-[11px] leading-5 text-[#A1A1AA]">Este projeto não tem autenticação real nem backend de IA. O Gemini está apenas como dependência; nenhuma chave é usada no navegador. As ações analíticas usam dados locais com regras visíveis. Mensagens livres não são enviadas a terceiros e não recebem respostas simuladas.</p></div></div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#FBBF24]" /><h2 className="text-xs font-semibold text-white">Central de ações</h2><span className="text-[10px] text-[#71717A]">Análises locais e transparentes</span></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {actions.map((action) => <button key={action.id} type="button" onClick={() => startAction(action.id)} className="rounded-xl border border-white/[0.08] bg-[#101010] p-3 text-left transition-colors hover:border-[#F59E0B]/30 hover:bg-[#141414]"><span className="block text-xs font-medium text-white">{action.title}</span><span className="mt-1 block text-[10px] leading-4 text-[#71717A]">{action.description}</span></button>)}
        </div>
      </section>

      {historyOpen && <section className={`${card} p-4 xl:hidden`}>{historyList}</section>}

      {storageError && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3 text-xs text-red-200">{storageError}</p>}

      <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className={`${card} hidden p-4 xl:block`}>{historyList}</aside>

        <section className={`${card} flex min-h-[560px] min-w-0 flex-col overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div className="min-w-0"><p className="truncate text-xs font-medium text-white">{activeConversation?.title || 'Nova conversa'}</p><p className="mt-0.5 text-[10px] text-[#71717A]">Contexto usado somente nesta sessão do navegador</p></div>
            <button type="button" onClick={() => setContextOpen((value) => !value)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] text-[#A1A1AA] hover:text-white xl:hidden">{contextOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}Contexto</button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            {!activeConversation?.messages.length && <div className="flex min-h-[350px] flex-col items-center justify-center text-center"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#FBBF24]"><Sparkles className="h-5 w-5" /></span><h2 className="mt-4 text-base font-semibold text-white">O que precisa avançar hoje?</h2><p className="mt-2 max-w-sm text-xs leading-5 text-[#A1A1AA]">Escolha uma ação rápida para analisar seus registros ou escreva uma mensagem. Sem IA conectada, não vou fingir que gerei uma resposta.</p></div>}
            {activeConversation?.messages.map((message) => <article key={message.id} className={`max-w-[95%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div className={`rounded-2xl px-3.5 py-3 text-xs leading-5 ${message.role === 'user' ? 'bg-[#F59E0B]/10 text-[#FDE68A]' : 'border border-white/[0.07] bg-black/20 text-[#D4D4D8]'}`}>
                {message.role === 'assistant' && <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#FBBF24]"><Sparkles className="h-3 w-3" />Daily AI · {message.actionId ? 'Análise local' : 'Status da integração'}</p>}
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.actionId && <LocalAnalysis key={`${activeConversation?.id}-${message.id}`} action={message.actionId} data={data} onOpenTask={onOpenTask} onOpenProject={onOpenProject} onOpenIdeas={onOpenIdeas} onStartFocus={onStartFocus} onApprovePriorities={onApprovePriorities} onNotify={onNotify} />}
              </div>
              <p className={`mt-1 text-[9px] text-[#52525B] ${message.role === 'user' ? 'text-right' : ''}`}>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(message.createdAt)}</p>
            </article>)}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="border-t border-white/[0.07] p-3 sm:p-4">
            <label htmlFor="daily-ai-message" className="sr-only">Sua mensagem</label>
            <textarea id="daily-ai-message" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={2} maxLength={12_000} placeholder="Conte o que você precisa organizar, resolver ou executar..." className={`${field} resize-none`} />
            <div className="mt-2 flex items-center justify-between gap-3"><p className="text-[9px] text-[#52525B]">Enter envia · Shift + Enter quebra linha · Anexos indisponíveis</p><button type="submit" disabled={!draft.trim()} aria-label="Enviar mensagem" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#F59E0B] text-black transition-colors hover:bg-[#FBBF24] disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button></div>
          </form>
        </section>

        <aside className={`${card} space-y-4 p-4 ${contextOpen ? 'block' : 'hidden'} xl:block`}>
          <div className="flex items-center gap-2"><Target className="h-4 w-4 text-[#FBBF24]" /><h2 className="text-xs font-semibold text-white">Seu contexto local</h2></div>
          <p className="text-[10px] leading-4 text-[#71717A]">Estes dados vêm do dashboard neste dispositivo. Nenhum conteúdo é enviado a uma IA.</p>
          <section className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-[#71717A]">Missão de hoje</p><p className="mt-1.5 text-xs font-medium text-white">{data.mission?.title || 'Não definida'}</p></section>
          <section><p className="mb-2 flex items-center gap-1.5 text-[10px] text-[#71717A]"><ListChecks className="h-3.5 w-3.5" />Prioridades ({currentPriorities.length}/3)</p><div className="space-y-1.5">{currentPriorities.map((task) => <button type="button" key={task.id} onClick={() => onOpenTask(task.id)} className="block w-full truncate rounded-lg bg-white/[0.03] px-2.5 py-2 text-left text-[10px] text-[#D4D4D8] hover:text-[#FBBF24]">{task.title}</button>)}{!currentPriorities.length && <p className="text-[10px] text-[#52525B]">Nenhuma prioridade definida.</p>}</div></section>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-[#71717A]">Pendentes</p><p className="mt-1 text-lg font-semibold text-white">{data.tasks.filter(taskIsOpen).length}</p></div><div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-[#71717A]">Foco hoje</p><p className="mt-1 text-sm font-semibold text-white">{timeLabel(Math.floor(todayFocus / 60))}</p></div></div>
          <section><p className="mb-2 flex items-center gap-1.5 text-[10px] text-[#71717A]"><FolderKanban className="h-3.5 w-3.5" />Projetos ativos</p><div className="space-y-1.5">{data.projects.filter((project) => !project.archivedAt && (project.status === 'Ativo' || project.status === 'Em andamento')).slice(0, 4).map((project) => <button type="button" key={project.id} onClick={() => onOpenProject(project.id)} className="block w-full truncate rounded-lg bg-white/[0.03] px-2.5 py-2 text-left text-[10px] text-[#D4D4D8] hover:text-[#FBBF24]">{project.name}</button>)}{!data.projects.some((project) => !project.archivedAt && (project.status === 'Ativo' || project.status === 'Em andamento')) && <p className="text-[10px] text-[#52525B]">Nenhum projeto ativo.</p>}</div></section>
          <section><p className="mb-2 flex items-center gap-1.5 text-[10px] text-[#71717A]"><Lightbulb className="h-3.5 w-3.5" />Ideias recentes</p><div className="space-y-1.5">{data.ideas.filter((idea) => idea.status !== 'trash' && idea.status !== 'archived').sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)).slice(0, 3).map((idea) => <button type="button" key={idea.id} onClick={onOpenIdeas} className="block w-full truncate rounded-lg bg-white/[0.03] px-2.5 py-2 text-left text-[10px] text-[#D4D4D8] hover:text-[#FBBF24]">{idea.title || idea.text.slice(0, 44) || 'Ideia sem título'}</button>)}{!data.ideas.some((idea) => idea.status !== 'trash' && idea.status !== 'archived') && <p className="text-[10px] text-[#52525B]">Nenhuma ideia recente.</p>}</div></section>
          {recommended && <button type="button" onClick={() => onStartFocus(recommended)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#F59E0B]/20 px-3 py-2.5 text-[10px] font-medium text-[#FBBF24] hover:bg-[#F59E0B]/[0.06]"><Clock3 className="h-3.5 w-3.5" />Iniciar próxima tarefa no foco</button>}
        </aside>
      </div>
    </div>
  );
};
