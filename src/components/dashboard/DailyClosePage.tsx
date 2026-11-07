import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Lightbulb, ListChecks,
  MessageCircle, MoonStar, Sparkles, Target, Timer, X,
} from 'lucide-react';
import { localDateKey } from './dashboardService';
import { createDailyReview, dailyReviewService, type DailyReview, type PendingAction } from './dailyReviewService';
import type { DashboardProject, DashboardState, DashboardTask, Idea } from './types';

interface DailyClosePageProps {
  data: DashboardState;
  onComplete: (review: DailyReview, nextDayPlan: NonNullable<DashboardState['nextDayPlan']>) => void;
  onCreateTask: (title: string, day: string) => string | null;
  onApplyTaskAction: (task: DashboardTask, action: PendingAction, targetDate: string) => void;
  onSaveIdea: (idea: Omit<Idea, 'id' | 'createdAt'>) => string;
  onOpenTask: (taskId: string) => void;
  onOpenDailyAi: (action: string) => void;
  onNotify: (message: string) => void;
}

const steps = ['Entregas', 'Pendências', 'Como foi', 'Seu tempo', 'Ideias', 'Amanhã'];
const challenges = ['Distrações', 'Falta de clareza', 'Excesso de tarefas', 'Problemas técnicos', 'Interrupções externas', 'Falta de energia', 'Planejamento inadequado', 'Outro'];
const focusRatings = ['Sim, na maior parte do tempo', 'Parcialmente', 'Tive muita dificuldade'];
const card = 'rounded-2xl border border-white/[0.08] bg-[#101010]';
const field = 'w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#F59E0B]/50';
const tomorrow = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return localDateKey(new Date(year, month - 1, day + 1));
};
const dateLabel = (date: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  .format(new Date(`${date}T12:00:00`));
const shortDate = (date: string) => date ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`)) : 'Sem prazo';

function completedToday(task: DashboardTask, date: string): boolean {
  return task.status === 'Concluído' && (task.history.some((entry) => entry.action.toLocaleLowerCase('pt-BR').includes('conclu') && localDateKey(new Date(entry.createdAt)) === date)
    || localDateKey(new Date(task.updatedAt)) === date);
}

function pendingTasks(tasks: DashboardTask[], date: string): DashboardTask[] {
  return tasks.filter((task) => !task.archivedAt && task.status !== 'Concluído'
    && (task.day === date || task.day < date || task.dueAt === date || (task.dueAt && task.dueAt < date)));
}

function completedTaskIds(review: DailyReview, data: DashboardState): DashboardTask[] {
  return data.tasks.filter((task) => completedToday(task, review.reviewDate));
}

function sessionDuration(session: DashboardState['focusHistory'][number]): number {
  return session.actualFocusSeconds ?? session.durationMinutes * 60;
}

function formattedSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}min` : `${minutes} min`;
}

function ReviewTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block text-xs font-medium text-[#D4D4D8]">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} maxLength={1500} placeholder={placeholder} className={`${field} mt-2 resize-y`} /></label>;
}

function ReviewHistory({ reviews, data, onOpen }: { reviews: DailyReview[]; data: DashboardState; onOpen: (review: DailyReview) => void }) {
  const [filter, setFilter] = useState<'Tudo' | 'Hoje' | '7 dias' | '30 dias'>('Tudo');
  const [ratingFilter, setRatingFilter] = useState('');
  const today = localDateKey();
  const filtered = reviews.filter((review) => {
    if (ratingFilter && String(review.productivityRating || '') !== ratingFilter) return false;
    if (filter === 'Hoje') return review.reviewDate === today;
    const span = filter === '7 dias' ? 7 : filter === '30 dias' ? 30 : 0;
    if (span) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - span + 1);
      return review.reviewDate >= localDateKey(start);
    }
    return true;
  });
  return (
    <section className={`${card} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-semibold text-white">Histórico de encerramentos</h2><p className="mt-1 text-[10px] text-[#71717A]">Revisões armazenadas neste navegador; não alteram tarefas atuais ao serem abertas.</p></div><div className="flex gap-2"><select aria-label="Filtrar encerramentos por período" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-2.5 py-2 text-[10px] text-white">{['Tudo', 'Hoje', '7 dias', '30 dias'].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filtrar por avaliação" value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-2.5 py-2 text-[10px] text-white"><option value="">Todas avaliações</option>{[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{item}/5</option>)}</select></div></div>
      <div className="mt-3 space-y-2">{filtered.map((review) => <button key={review.id} type="button" onClick={() => onOpen(review)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] p-3 text-left hover:border-[#F59E0B]/25"><span><span className="block text-xs font-medium text-white">{dateLabel(review.reviewDate)}</span><span className="mt-1 block text-[10px] text-[#A1A1AA]">{review.mainDelivery || 'Sem entrega principal registrada'} · {review.status === 'completed' ? 'Finalizado' : 'Rascunho'}</span></span><span className="text-right text-[10px] text-[#71717A]">{review.productivityRating ? `Avaliação ${review.productivityRating}/5` : 'Sem avaliação'} · {data.focusHistory.filter((session) => localDateKey(new Date(session.startedAt)) === review.reviewDate).length} sessões</span></button>)}
      {!filtered.length && <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-[#71717A]">Nenhum encerramento encontrado para este filtro.</p>}</div>
    </section>
  );
}

export const DailyClosePage: React.FC<DailyClosePageProps> = ({ data, onComplete, onCreateTask, onApplyTaskAction, onSaveIdea, onOpenTask, onOpenDailyAi, onNotify }) => {
  const today = localDateKey();
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [review, setReview] = useState<DailyReview>(() => createDailyReview(today));
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [manualDelivery, setManualDelivery] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState(tomorrow(today));
  const [ideaStatus, setIdeaStatus] = useState('');
  const [proposalOpen, setProposalOpen] = useState(false);

  const dateSessions = data.focusHistory.filter((session) => localDateKey(new Date(session.startedAt)) === review.reviewDate);
  const focusSeconds = dateSessions.reduce((total, session) => total + sessionDuration(session), 0);
  const focusTasks = [...new Set(dateSessions.map((session) => session.taskId).filter((id): id is string => Boolean(id)))];
  const doneTasks = completedTaskIds(review, data);
  const pending = pendingTasks(data.tasks, review.reviewDate);
  const daySchedule = data.schedule.filter((item) => item.day === review.reviewDate);
  const taskSchedule = data.tasks.filter((task) => !task.archivedAt && task.scheduledAt && (task.scheduledDay || task.day) === review.reviewDate);
  const plannedMinutes = [...new Map([...daySchedule.filter((item) => !item.taskId).map((item) => [item.id, item.durationMinutes] as const), ...taskSchedule.map((task) => [task.id, task.estimatedMinutes] as const)]).values()].reduce((sum, minutes) => sum + minutes, 0);
  const tomorrowDate = tomorrow(review.reviewDate);
  const tomorrowBlocks = data.schedule.filter((item) => item.day === tomorrowDate);
  const tomorrowTasks = data.tasks.filter((task) => !task.archivedAt && task.status !== 'Concluído' && (task.scheduledDay === tomorrowDate || task.day === tomorrowDate || task.dueAt === tomorrowDate));
  const completedProjects = [...new Set(doneTasks.map((task) => task.projectId).filter(Boolean))].map((id) => data.projects.find((project) => project.id === id)).filter((project): project is DashboardProject => Boolean(project));
  const projectActivity = data.projects.filter((project) => project.activity.some((item) => localDateKey(new Date(item.createdAt)) === review.reviewDate));
  const currentTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(Date.now());

  useEffect(() => {
    try {
      const saved = dailyReviewService.load();
      setReviews(saved);
      const existing = saved.find((item) => item.reviewDate === today);
      setReview(existing || createDailyReview(today));
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Não foi possível carregar os encerramentos.');
    } finally {
      setLoaded(true);
    }
  }, [today]);

  useEffect(() => {
    if (!loaded || storageError || readOnly) return;
    try {
      const next = reviews.some((item) => item.reviewDate === review.reviewDate)
        ? reviews.map((item) => item.id === review.id ? review : item)
        : [review, ...reviews];
      setReviews(next.sort((a, b) => b.reviewDate.localeCompare(a.reviewDate)));
      dailyReviewService.save(next);
    } catch {
      setStorageError('Não foi possível salvar a revisão neste navegador. Verifique o espaço de armazenamento disponível.');
    }
  }, [review, loaded, readOnly]);

  const updateReview = (changes: Partial<DailyReview>) => {
    if (readOnly) return;
    setReview((current) => ({ ...current, ...changes, updatedAt: Date.now() }));
  };

  const saveAndContinue = () => {
    if (readOnly) {
      setReadOnly(false);
      setReview(createDailyReview(today));
      onNotify('Nova revisão do dia iniciada. O histórico anterior foi preservado.');
      return;
    }
    setReview((current) => ({ ...current, updatedAt: Date.now() }));
    onNotify('Progresso salvo neste dispositivo. Você pode continuar depois.');
  };

  const addManualDelivery = () => {
    const value = manualDelivery.trim();
    if (!value) return;
    updateReview({ manualDeliveries: [...review.manualDeliveries, value].slice(0, 20) });
    setManualDelivery('');
  };

  const addPendingTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const id = onCreateTask(title, taskDate);
    if (!id) return;
    setNewTaskTitle('');
    onNotify('Tarefa registrada e vinculada ao próximo dia selecionado.');
  };

  const saveReviewIdea = () => {
    if (!review.ideaTitle.trim() && !review.ideaContent.trim()) {
      onNotify('Adicione um título ou conteúdo para salvar a ideia.');
      return;
    }
    const savedId = onSaveIdea({
      title: review.ideaTitle.trim(),
      text: review.ideaContent.trim(),
      link: '',
      type: review.ideaType as Idea['type'],
      category: review.ideaCategory.trim(),
      tags: review.ideaTags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
      projectId: review.ideaProjectId,
      collectionIds: [],
      favorite: false,
      status: 'inbox',
      updatedAt: Date.now(),
    });
    if (savedId) {
      updateReview({ ideaSavedId: savedId });
      setIdeaStatus('Ideia salva no Cofre. Você pode organizá-la depois.');
    }
  };

  const proposePlan = () => {
    const available = pending.filter((task) => task.status !== 'Em andamento').sort((a, b) => {
      const priority = { Urgente: 4, Alta: 3, Média: 2, Baixa: 1 };
      return priority[b.priority] - priority[a.priority] || a.dueAt.localeCompare(b.dueAt);
    });
    const candidates = [
      ...available.filter((task) => task.dueAt === tomorrowDate),
      ...available.filter((task) => task.dueAt && task.dueAt < tomorrowDate),
      ...available.filter((task) => !task.dueAt || task.dueAt > tomorrowDate),
    ];
    const unique = [...new Map(candidates.map((task) => [task.id, task])).values()].slice(0, 3);
    updateReview({
      tomorrowMission: review.tomorrowMission || (unique[0] ? `Avançar: ${unique[0].title}` : ''),
      tomorrowPriorityIds: unique.map((task) => task.id),
      firstTaskId: unique[0]?.id || '',
    });
    setProposalOpen(true);
  };

  const finalize = () => {
    if (readOnly) return;
    if (!window.confirm('Finalizar o encerramento deste dia? Você ainda poderá consultar esta revisão no histórico.')) return;
    for (const [taskId, choice] of Object.entries(review.pendingActions)) {
      const task = data.tasks.find((item) => item.id === taskId);
      if (task) onApplyTaskAction(task, choice.action, choice.targetDate);
    }
    const completed = { ...review, status: 'completed' as const, completedAt: Date.now(), updatedAt: Date.now(), step: steps.length - 1 };
    const next = [completed, ...reviews.filter((item) => item.reviewDate !== completed.reviewDate)];
    try {
      dailyReviewService.save(next);
      setReviews(next);
      setReview(completed);
      onComplete(completed, {
        reviewDate: completed.reviewDate,
        mission: completed.tomorrowMission,
        priorityTaskIds: completed.tomorrowPriorityIds,
        firstTaskId: completed.firstTaskId,
      });
      onNotify('Encerramento concluído. A revisão foi salva no histórico local.');
    } catch {
      setStorageError('Não foi possível finalizar e salvar o encerramento.');
    }
  };

  const openHistoryReview = (item: DailyReview) => {
    setReview(item);
    setReadOnly(true);
    setHistoryOpen(false);
    setProposalOpen(false);
  };

  const beginTodayReview = () => {
    setReview(reviews.find((item) => item.reviewDate === today) || createDailyReview(today));
    setReadOnly(false);
    setProposalOpen(false);
  };

  const stepContent = useMemo(() => {
    if (review.step === 0) return (
      <section className={`${card} p-4 sm:p-6`}>
        <SectionHeading icon={<CheckCircle2 className="h-4 w-4" />} title="O que você realizou hoje?" description="Consideramos apenas conclusões registradas e atividade real dos módulos." />
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Tarefas concluídas" value={doneTasks.length} /><Metric label="Sessões de foco" value={dateSessions.length} /><Metric label="Tempo de foco registrado" value={formattedSeconds(focusSeconds)} /></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2"><div><h3 className="text-xs font-semibold text-white">Entregas cadastradas</h3><div className="mt-2 space-y-2">{doneTasks.map((task) => <button key={task.id} type="button" onClick={() => onOpenTask(task.id)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] p-3 text-left hover:border-[#F59E0B]/25"><span className="min-w-0"><span className="block truncate text-xs text-white">{task.title}</span><span className="mt-1 block text-[10px] text-[#71717A]">{data.projects.find((project) => project.id === task.projectId)?.name || 'Sem projeto'}</span></span><Check className="h-3.5 w-3.5 text-emerald-300" /></button>)}{!doneTasks.length && <p className="rounded-xl border border-dashed border-white/10 p-3 text-[11px] text-[#71717A]">Nenhuma tarefa foi registrada como concluída hoje.</p>}</div></div><div><h3 className="text-xs font-semibold text-white">Projetos com atividade hoje</h3><div className="mt-2 space-y-2">{[...new Map([...completedProjects, ...projectActivity].map((project) => [project.id, project])).values()].map((project) => <div key={project.id} className="rounded-xl border border-white/[0.07] p-3"><p className="text-xs text-white">{project.name}</p><p className="mt-1 text-[10px] text-[#71717A]">{project.activity.find((item) => localDateKey(new Date(item.createdAt)) === review.reviewDate)?.action || 'Tarefa concluída neste projeto'}</p></div>)}{!completedProjects.length && !projectActivity.length && <p className="rounded-xl border border-dashed border-white/10 p-3 text-[11px] text-[#71717A]">Sem atividade de projeto registrada hoje.</p>}</div></div></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2"><ReviewTextarea label="Qual foi sua principal entrega de hoje?" value={review.mainDelivery} onChange={(mainDelivery) => updateReview({ mainDelivery })} placeholder="Registre a entrega mais importante..." /><ReviewTextarea label="Qual foi a coisa mais importante que você conseguiu avançar?" value={review.biggestProgress} onChange={(biggestProgress) => updateReview({ biggestProgress })} placeholder="Um avanço, mesmo que pequeno..." /></div>
        <div className="mt-4"><p className="text-xs font-medium text-[#D4D4D8]">Registrar outra entrega manual</p><div className="mt-2 flex gap-2"><input value={manualDelivery} onChange={(event) => setManualDelivery(event.target.value)} maxLength={200} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addManualDelivery())} placeholder="Algo feito que não estava cadastrado como tarefa" className={field} /><button type="button" onClick={addManualDelivery} className="shrink-0 rounded-lg border border-white/10 px-3 text-xs text-[#FBBF24]">Adicionar</button></div><ul className="mt-2 space-y-1">{review.manualDeliveries.map((item, index) => <li key={`${item}-${index}`} className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-[#D4D4D8]">{item}<button type="button" onClick={() => updateReview({ manualDeliveries: review.manualDeliveries.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remover ${item}`}><X className="h-3 w-3" /></button></li>)}</ul></div>
      </section>
    );
    if (review.step === 1) return (
      <section className={`${card} p-4 sm:p-6`}>
        <SectionHeading icon={<ListChecks className="h-4 w-4" />} title="O que ficou para depois?" description="Escolha uma ação por tarefa. As mudanças só serão aplicadas ao finalizar o encerramento." />
        <div className="mt-4 space-y-2">{pending.map((task) => {
          const selection = review.pendingActions[task.id] || { action: 'undated' as PendingAction, targetDate: tomorrowDate };
          return <div key={task.id} className="grid gap-3 rounded-xl border border-white/[0.07] p-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"><button type="button" onClick={() => onOpenTask(task.id)} className="min-w-0 text-left"><span className="block truncate text-xs font-medium text-white">{task.title}</span><span className="mt-1 block text-[10px] text-[#71717A]">{data.projects.find((project) => project.id === task.projectId)?.name || 'Sem projeto'} · {task.priority} · {task.status} · {task.estimatedMinutes} min · Prazo {shortDate(task.dueAt)}</span></button><div className="flex gap-2"><select aria-label={`Destino para ${task.title}`} value={selection.action} onChange={(event) => updateReview({ pendingActions: { ...review.pendingActions, [task.id]: { ...selection, action: event.target.value as PendingAction } } })} className={`${field} min-w-0 py-2 text-[10px]`}><option value="undated">Manter sem data</option><option value="tomorrow">Reagendar amanhã</option><option value="choose_date">Escolher data</option><option value="split">Dividir depois</option><option value="archive">Arquivar</option><option value="cancel">Cancelar tarefa</option></select></div>{selection.action === 'choose_date' && <input aria-label={`Nova data para ${task.title}`} type="date" min={tomorrowDate} value={selection.targetDate || tomorrowDate} onChange={(event) => updateReview({ pendingActions: { ...review.pendingActions, [task.id]: { ...selection, targetDate: event.target.value } } })} className={`${field} py-2 text-[10px] sm:col-start-2`} />}</div>;
        })}{!pending.length && <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-[#71717A]">Não há tarefas pendentes ligadas a este dia.</p>}</div>
        <div className="mt-5"><ReviewTextarea label="Existe alguma pendência importante que não está registrada no sistema?" value={review.missingPending} onChange={(missingPending) => updateReview({ missingPending })} placeholder="Anote aqui; se quiser, crie a tarefa logo abaixo." /></div>
        <div className="mt-3 flex flex-wrap gap-2"><input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} maxLength={160} placeholder="Criar tarefa para amanhã..." className={`${field} min-w-[180px] flex-1`} /><input aria-label="Data da nova tarefa" type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} className={`${field} w-auto`} /><button type="button" onClick={addPendingTask} disabled={!newTaskTitle.trim()} className="rounded-lg border border-[#F59E0B]/20 px-3 text-xs text-[#FBBF24] disabled:opacity-40">Criar tarefa</button></div>
        {Object.values(review.pendingActions).some((item) => item.action === 'split') && <p className="mt-3 text-[10px] leading-4 text-[#A1A1AA]">Dividir tarefas exige proposta manual ou IA configurada; nenhuma subtarefa será criada automaticamente.</p>}
      </section>
    );
    if (review.step === 2) return (
      <section className={`${card} space-y-5 p-4 sm:p-6`}>
        <SectionHeading icon={<MessageCircle className="h-4 w-4" />} title="Como foi seu dia?" description="Responda só o que for útil. Você pode pular qualquer pergunta." />
        <fieldset><legend className="text-xs font-medium text-[#D4D4D8]">Como você avalia sua produtividade hoje?</legend><div className="mt-3 flex flex-wrap gap-2">{['1 — Muito baixa', '2 — Abaixo do esperado', '3 — Regular', '4 — Boa', '5 — Excelente'].map((label, index) => <button key={label} type="button" aria-pressed={review.productivityRating === index + 1} onClick={() => updateReview({ productivityRating: index + 1 })} className={`rounded-lg border px-3 py-2 text-[10px] ${review.productivityRating === index + 1 ? 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#FBBF24]' : 'border-white/10 text-[#A1A1AA] hover:text-white'}`}>{label}</button>)}</div></fieldset>
        <label className="block text-xs font-medium text-[#D4D4D8]">O que mais atrapalhou sua execução?<select value={review.difficulty} onChange={(event) => updateReview({ difficulty: event.target.value })} className={`${field} mt-2`}><option value="">Prefiro não responder</option>{challenges.map((item) => <option key={item}>{item}</option>)}</select></label>
        {review.difficulty === 'Outro' && <label className="block text-xs text-[#D4D4D8]">Conte brevemente<input value={review.customDifficulty} onChange={(event) => updateReview({ customDifficulty: event.target.value })} maxLength={300} className={`${field} mt-2`} /></label>}
        <fieldset><legend className="text-xs font-medium text-[#D4D4D8]">Você conseguiu manter o foco?</legend><div className="mt-2 flex flex-wrap gap-2">{focusRatings.map((item) => <button key={item} type="button" aria-pressed={review.focusRating === item} onClick={() => updateReview({ focusRating: item })} className={`rounded-lg border px-3 py-2 text-[10px] ${review.focusRating === item ? 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#FBBF24]' : 'border-white/10 text-[#A1A1AA]'}`}>{item}</button>)}</div></fieldset>
        <div className="grid gap-4 sm:grid-cols-2"><ReviewTextarea label="O que poderia ter sido feito melhor?" value={review.improvementNotes} onChange={(improvementNotes) => updateReview({ improvementNotes })} placeholder="Sem julgamentos, apenas observações..." /><ReviewTextarea label="O que você aprendeu hoje?" value={review.lessonsLearned} onChange={(lessonsLearned) => updateReview({ lessonsLearned })} placeholder="Um aprendizado para levar adiante..." /></div>
      </section>
    );
    if (review.step === 3) {
      const plannedTasks = data.tasks.filter((task) => !task.archivedAt && task.scheduledAt && (task.scheduledDay || task.day) === review.reviewDate);
      const doneCount = plannedTasks.filter((task) => task.status === 'Concluído').length;
      const interrupted = dateSessions.filter((session) => !session.completed || session.status === 'Interrompida').length;
      const breaks = dateSessions.reduce((sum, session) => sum + (session.breakSeconds || 0), 0);
      const projectTimes = data.projects.map((project) => ({ project, seconds: dateSessions.filter((session) => session.projectId === project.id).reduce((sum, session) => sum + sessionDuration(session), 0) })).filter((item) => item.seconds > 0);
      return <section className={`${card} p-4 sm:p-6`}><SectionHeading icon={<Timer className="h-4 w-4" />} title="Para onde foi seu tempo?" description="Tempo de foco registrado não representa o total de horas trabalhadas." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Foco registrado" value={formattedSeconds(focusSeconds)} /><Metric label="Sessões" value={dateSessions.length} /><Metric label="Interrompidas" value={interrupted} /><Metric label="Pausas registradas" value={formattedSeconds(breaks)} /></div>
        <div className="mt-5 rounded-xl border border-white/[0.07] p-4"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-white">Planejado × concluído</h3><span className="text-[10px] text-[#71717A]">{plannedTasks.length ? `${doneCount}/${plannedTasks.length} tarefas planejadas concluídas` : 'Sem tarefas agendadas neste dia'}</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-[10px] text-[#71717A]">Tempo planejado</p><p className="mt-1 text-sm font-medium text-white">{plannedMinutes ? formattedSeconds(plannedMinutes * 60) : 'Sem dados'}</p><div className="mt-2 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-[#71717A]" style={{ width: `${plannedMinutes ? 100 : 0}%` }} /></div></div><div><p className="text-[10px] text-[#71717A]">Tempo de foco</p><p className="mt-1 text-sm font-medium text-white">{dateSessions.length ? formattedSeconds(focusSeconds) : 'Sem dados suficientes'}</p><div className="mt-2 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${plannedMinutes ? Math.min(100, focusSeconds / (plannedMinutes * 60) * 100) : 0}%` }} /></div></div></div></div>
        {projectTimes.length > 0 && <div className="mt-4"><h3 className="text-xs font-semibold text-white">Foco por projeto</h3><div className="mt-2 space-y-2">{projectTimes.map((item) => <div key={item.project.id} className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-[10px] text-[#D4D4D8]"><span>{item.project.name}</span><span>{formattedSeconds(item.seconds)}</span></div>)}</div></div>}
      </section>;
    }
    if (review.step === 4) return (
      <section className={`${card} p-4 sm:p-6`}>
        <SectionHeading icon={<Lightbulb className="h-4 w-4" />} title="Algo importante surgiu hoje?" description="Capture agora e organize no Cofre de Ideias quando quiser." />
        {review.ideaSavedId && <p className="mt-4 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-3 text-xs text-emerald-100">{ideaStatus || 'Ideia já registrada no Cofre.'}</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#D4D4D8]">Título<input value={review.ideaTitle} onChange={(event) => updateReview({ ideaTitle: event.target.value })} maxLength={120} className={`${field} mt-2`} /></label><label className="text-xs text-[#D4D4D8]">Tipo<select value={review.ideaType} onChange={(event) => updateReview({ ideaType: event.target.value })} className={`${field} mt-2`}>{['Ideia', 'Oportunidade', 'Anotação', 'Referência', 'Observação', 'Pesquisa', 'Inspiração'].map((item) => <option key={item}>{item}</option>)}</select></label><ReviewTextarea label="Conteúdo" value={review.ideaContent} onChange={(ideaContent) => updateReview({ ideaContent })} placeholder="Anote o que não quer esquecer..." /><label className="text-xs text-[#D4D4D8]">Projeto (opcional)<select value={review.ideaProjectId} onChange={(event) => updateReview({ ideaProjectId: event.target.value })} className={`${field} mt-2`}><option value="">Sem projeto</option>{data.projects.filter((project) => !project.archivedAt).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="text-xs text-[#D4D4D8]">Categoria<input value={review.ideaCategory} onChange={(event) => updateReview({ ideaCategory: event.target.value })} maxLength={60} className={`${field} mt-2`} /></label><label className="text-xs text-[#D4D4D8]">Etiquetas<input value={review.ideaTags} onChange={(event) => updateReview({ ideaTags: event.target.value })} placeholder="Separadas por vírgula" maxLength={200} className={`${field} mt-2`} /></label></div>
        <button type="button" onClick={saveReviewIdea} disabled={Boolean(review.ideaSavedId)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#F59E0B]/20 px-3.5 py-2.5 text-xs text-[#FBBF24] disabled:opacity-40"><Lightbulb className="h-3.5 w-3.5" />Salvar no Cofre</button>
      </section>
    );
    return (
      <section className={`${card} p-4 sm:p-6`}>
        <SectionHeading icon={<Target className="h-4 w-4" />} title="Prepare seu próximo dia" description={`Revise as tarefas e os compromissos já cadastrados para ${dateLabel(tomorrowDate)}.`} />
        <label className="mt-5 block text-xs font-medium text-[#D4D4D8]">Missão de amanhã<input value={review.tomorrowMission} onChange={(event) => updateReview({ tomorrowMission: event.target.value })} maxLength={160} placeholder="Qual resultado faria amanhã valer a pena?" className={`${field} mt-2`} /></label>
        <div className="mt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold text-white">Até três prioridades</h3><span className="text-[10px] text-[#71717A]">{review.tomorrowPriorityIds.length}/3</span></div><div className="mt-2 space-y-2">{data.tasks.filter((task) => !task.archivedAt && task.status !== 'Concluído').slice(0, 50).map((task) => { const checked = review.tomorrowPriorityIds.includes(task.id); return <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] p-3"><input type="checkbox" checked={checked} onChange={() => { const ids = checked ? review.tomorrowPriorityIds.filter((id) => id !== task.id) : review.tomorrowPriorityIds.length < 3 ? [...review.tomorrowPriorityIds, task.id] : review.tomorrowPriorityIds; updateReview({ tomorrowPriorityIds: ids, firstTaskId: review.firstTaskId === task.id && !checked ? task.id : review.firstTaskId }); }} className="mt-0.5 accent-[#F59E0B]" /><span className="min-w-0 flex-1"><span className="block text-xs text-white">{task.title}</span><span className="mt-1 block text-[10px] text-[#71717A]">{task.priority} · {task.status} · prazo {shortDate(task.dueAt)}</span></span></label>; })}{!data.tasks.some((task) => !task.archivedAt && task.status !== 'Concluído') && <p className="text-[10px] text-[#71717A]">Não há tarefas abertas cadastradas para selecionar.</p>}</div></div>
        <div className="mt-4"><label className="block text-xs font-medium text-[#D4D4D8]">Primeira tarefa do próximo dia<select value={review.firstTaskId} onChange={(event) => updateReview({ firstTaskId: event.target.value })} className={`${field} mt-2`}><option value="">Selecione uma tarefa</option>{review.tomorrowPriorityIds.map((id) => data.tasks.find((task) => task.id === id)).filter((task): task is DashboardTask => Boolean(task)).map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label></div>
        <div className="mt-5 rounded-xl border border-white/[0.07] p-3"><h3 className="text-xs font-semibold text-white">Compromissos e blocos já cadastrados</h3><div className="mt-2 space-y-1">{[...tomorrowBlocks.map((item) => `${item.time} · ${item.title}`), ...tomorrowTasks.map((task) => `${task.scheduledAt || 'Sem horário'} · ${task.title}`)].slice(0, 8).map((item) => <p key={item} className="text-[10px] text-[#A1A1AA]">{item}</p>)}{!tomorrowBlocks.length && !tomorrowTasks.length && <p className="text-[10px] text-[#71717A]">Nenhum compromisso para amanhã foi registrado.</p>}</div></div>
        <div className="mt-5 rounded-xl border border-[#F59E0B]/15 bg-[#F59E0B]/[0.035] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-white">Proposta para amanhã</p><p className="mt-1 text-[10px] text-[#A1A1AA]">Sugestão local por prioridade e prazo; não é uma resposta de IA.</p></div><button type="button" onClick={proposePlan} className="shrink-0 rounded-lg border border-[#F59E0B]/20 px-3 py-2 text-[10px] text-[#FBBF24]"><Sparkles className="mr-1 inline h-3 w-3" />Preparar meu amanhã</button></div>
          {proposalOpen && <div className="mt-3 space-y-2 text-[10px] leading-4 text-[#D4D4D8]"><p>Missão sugerida: {review.tomorrowMission || 'Escolha uma missão acima; não há tarefas abertas para sugerir.'}</p><p>Prioridades recomendadas: {review.tomorrowPriorityIds.map((id) => data.tasks.find((task) => task.id === id)?.title).filter(Boolean).join(' · ') || 'Nenhuma tarefa disponível.'}</p><p>Horários não serão preenchidos sem disponibilidade registrada. Revise e edite esta proposta antes de finalizar.</p></div>}
        </div>
        {review.status === 'completed' && <p className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3 text-xs text-emerald-100">Dia encerrado. Agora você sabe o que entregou e como começar amanhã.</p>}
      </section>
    );
  }, [review, readOnly, data, doneTasks, dateSessions, focusSeconds, pending, daySchedule, taskSchedule, plannedMinutes, completedProjects, projectActivity, tomorrowDate, tomorrowBlocks, tomorrowTasks, manualDelivery, newTaskTitle, taskDate, ideaStatus, proposalOpen, reviews]);

  if (!loaded) return <div className={`${card} p-8 text-center text-sm text-[#A1A1AA]`}>Carregando seu encerramento local…</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F59E0B]">Planeje. Execute. Encerre com clareza.</p><h1 className="mt-2 text-2xl font-semibold text-white">Encerramento do Dia</h1><p className="mt-1 text-sm text-[#A1A1AA]">Revise suas entregas. Organize suas pendências. Prepare seu próximo passo.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setHistoryOpen((value) => !value)} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8] hover:bg-white/[0.04]">{historyOpen ? 'Voltar à revisão' : 'Histórico'}</button>{readOnly && <button type="button" onClick={beginTodayReview} className="rounded-lg bg-[#F59E0B] px-3 py-2.5 text-xs font-semibold text-black">Revisar hoje</button>}</div></header>
      {storageError && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3 text-xs text-red-200">{storageError}</p>}
      {historyOpen ? <ReviewHistory reviews={reviews} data={data} onOpen={openHistoryReview} /> : <>
        <section className={`${card} p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-white">{dateLabel(review.reviewDate)}</p><p className="mt-1 text-[10px] text-[#71717A]">Horário local · {currentTime}{readOnly ? ' · Histórico somente leitura' : review.status === 'completed' ? ' · Encerramento concluído' : ' · Rascunho salvo automaticamente'}</p></div><button type="button" disabled={readOnly} onClick={saveAndContinue} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-[#D4D4D8] hover:bg-white/[0.04] disabled:opacity-50">Salvar e continuar depois</button></div>
          <div className="mt-4 flex gap-1">{steps.map((step, index) => <div key={step} className="h-1.5 flex-1 rounded-full bg-white/[0.06]"><div className={`h-full rounded-full transition-all ${index <= review.step ? 'bg-[#F59E0B]' : ''}`} /></div>)}</div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-[#71717A]"><span>Etapa {review.step + 1} de {steps.length} · {steps[review.step]}</span><span>{Math.round((review.step + 1) / steps.length * 100)}%</span></div>
        </section>
        {readOnly && <p className="rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-3 text-[11px] text-amber-100">Você está consultando uma revisão anterior. Suas alterações atuais não são afetadas.</p>}
        {review.status === 'completed' && !readOnly && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.035] p-3"><p className="text-xs text-emerald-100">Encerramento já concluído para esta data.</p><button type="button" onClick={() => setReview({ ...createDailyReview(today), ...review, status: 'draft', completedAt: null, step: 0 })} className="text-[10px] text-[#D4D4D8] underline">Editar revisão</button></div>}
        {stepContent}
        <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={review.step === 0} onClick={() => updateReview({ step: Math.max(0, review.step - 1) })} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2.5 text-xs text-[#D4D4D8] disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" />Voltar</button><div className="flex gap-2">{review.step === steps.length - 1 && review.status !== 'completed' && !readOnly && <button type="button" onClick={finalize} className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]"><MoonStar className="h-3.5 w-3.5" />Finalizar meu dia</button>}{review.step < steps.length - 1 && <button type="button" disabled={readOnly} onClick={() => updateReview({ step: Math.min(steps.length - 1, review.step + 1) })} className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24] disabled:opacity-40">Continuar<ArrowRight className="h-3.5 w-3.5" /></button>}{review.step === steps.length - 1 && review.status === 'completed' && <button type="button" onClick={() => onOpenDailyAi('Organizar meu dia')} className="rounded-lg border border-white/10 px-3.5 py-2.5 text-xs text-[#D4D4D8]">Abrir Daily AI</button>}</div></div>
      </>}
    </div>
  );
};

function SectionHeading({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="rounded-lg border border-[#F59E0B]/15 bg-[#F59E0B]/[0.07] p-2 text-[#FBBF24]">{icon}</span><div><h2 className="text-sm font-semibold text-white">{title}</h2><p className="mt-1 text-[11px] leading-5 text-[#A1A1AA]">{description}</p></div></div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-[#71717A]">{label}</p><p className="mt-1 text-lg font-semibold text-white">{value}</p></div>;
}
