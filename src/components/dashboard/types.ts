export type TaskPriority = 'Urgente' | 'Alta' | 'Média' | 'Baixa';
export type TaskStatus = 'A fazer' | 'Em andamento' | 'Em revisão' | 'Concluído';
export type ProjectStatus = 'Ativo' | 'Em andamento' | 'Pausado' | 'Concluído';
export type ProjectPriority = TaskPriority;

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface IdeaActivity {
  id: string;
  action: string;
  createdAt: number;
}

export interface TaskActivity {
  id: string;
  action: string;
  createdAt: number;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startAt: string;
  dueAt: string;
  completed: boolean;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  dueAt: string;
  completed: boolean;
}

export interface ProjectFile {
  id: string;
  name: string;
  data: string;
  createdAt: number;
}

export interface DailyMission {
  title: string;
  projectId: string;
  dueAt: string;
  completed: boolean;
  day: string;
}

export interface NextDayPlan {
  reviewDate: string;
  mission: string;
  priorityTaskIds: string[];
  firstTaskId: string;
}

export interface DashboardTask {
  id: string;
  day: string;
  dependsOnId: string;
  description: string;
  title: string;
  projectId: string;
  category: string;
  tags: string[];
  status: TaskStatus;
  priority: TaskPriority;
  startAt: string;
  estimatedMinutes: number;
  actualMinutes: number;
  actualSeconds?: number;
  dueAt: string;
  scheduledAt: string;
  scheduledDay?: string;
  recurrence: string;
  subtasks: TaskSubtask[];
  notes: string;
  history: TaskActivity[];
  completed: boolean;
  archivedAt: string;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardProject {
  id: string;
  name: string;
  description: string;
  objective: string;
  category: string;
  color: string;
  icon: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startAt: string;
  dueAt: string;
  createdAt: number;
  archivedAt: string;
  phases: ProjectPhase[];
  milestones: ProjectMilestone[];
  activity: TaskActivity[];
  files: ProjectFile[];
}

export interface ScheduleItem {
  id: string;
  day: string;
  title: string;
  time: string;
  durationMinutes: number;
  completed: boolean;
  type?: 'Tarefa' | 'Trabalho profundo' | 'Reunião' | 'Pausa' | 'Rotina pessoal' | 'Planejamento' | 'Personalizado';
  description?: string;
  taskId?: string;
  projectId?: string;
  notes?: string;
}

export interface Idea {
  id: string;
  text: string;
  link: string;
  category: string;
  projectId: string;
  createdAt: number;
  title?: string;
  type?: IdeaType;
  tags?: string[];
  collectionIds?: string[];
  favorite?: boolean;
  status?: IdeaStatus;
  updatedAt?: number;
  archivedAt?: number | null;
  deletedAt?: number | null;
  attachments?: IdeaAttachment[];
  conversionTaskIds?: string[];
  conversionProjectIds?: string[];
  conversions?: IdeaConversion[];
  activity?: IdeaActivity[];
  attachmentName?: string;
  attachmentData?: string;
}

export type IdeaType = 'Ideia' | 'Anotação' | 'Oportunidade' | 'Referência' | 'Pesquisa' | 'Inspiração' | 'Link' | 'Material de estudo' | 'Observação';
export type IdeaStatus = 'inbox' | 'organized' | 'archived' | 'trash' | 'converted_task' | 'converted_project';

export interface IdeaAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string;
  createdAt: number;
}

export interface IdeaConversion {
  type: 'task' | 'project';
  targetId: string;
  createdAt: number;
}

export interface IdeaCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: number;
}

export interface IdeaCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  ideaIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  projectId?: string | null;
  mode: string;
  startedAt: number;
  endedAt?: number;
  durationMinutes: number;
  completed: boolean;
  status?: 'Concluída' | 'Interrompida';
  targetDurationSeconds?: number | null;
  actualFocusSeconds?: number;
  breakSeconds?: number;
  concentrationRating?: 'Excelente' | 'Boa' | 'Regular' | 'Difícil' | null;
  notes?: string;
  cycleIndex?: number;
}

export interface ActiveFocusSession {
  taskId: string | null;
  projectId?: string | null;
  mode: string;
  durationMinutes: number | null;
  sessionStartedAt: number;
  startedAt: number | null;
  pausedAt: number | null;
  elapsedBeforePauseMs: number;
  id?: string;
  phase?: 'focus' | 'break';
  breakDurationMinutes?: number;
  totalCycles?: number;
  cycleIndex?: number;
  autoBreak?: boolean;
  autoNextCycle?: boolean;
  openEnded?: boolean;
  focusMode?: string;
  focusDurationMinutes?: number | null;
  parentSessionId?: string | null;
}

export interface FocusSessionConfig {
  taskId: string | null;
  projectId: string | null;
  mode: string;
  durationMinutes: number | null;
  breakDurationMinutes: number;
  cycles: number;
  autoBreak: boolean;
  autoNextCycle: boolean;
}

export interface DashboardState {
  profileName: string;
  focusGoalMinutes: number;
  onboardingComplete: boolean;
  mission: DailyMission | null;
  nextDayPlan?: NextDayPlan | null;
  tasks: DashboardTask[];
  dailyPriorityIds: string[];
  projects: DashboardProject[];
  schedule: ScheduleItem[];
  ideas: Idea[];
  ideaCategories: IdeaCategory[];
  ideaCollections: IdeaCollection[];
  activeFocus: ActiveFocusSession | null;
  focusHistory: FocusSession[];
}

export const initialDashboardState: DashboardState = {
  profileName: '',
  focusGoalMinutes: 120,
  onboardingComplete: false,
  mission: null,
  nextDayPlan: null,
  tasks: [],
  dailyPriorityIds: [],
  projects: [],
  schedule: [],
  ideas: [],
  ideaCategories: [
    { id: 'business', name: 'Negócios', color: '#F59E0B', icon: '💼', createdAt: 0 },
    { id: 'marketing', name: 'Marketing', color: '#EC4899', icon: '📣', createdAt: 0 },
    { id: 'content', name: 'Conteúdo', color: '#A855F7', icon: '✍️', createdAt: 0 },
    { id: 'technology', name: 'Tecnologia', color: '#3B82F6', icon: '⚙️', createdAt: 0 },
    { id: 'products', name: 'Produtos', color: '#14B8A6', icon: '📦', createdAt: 0 },
    { id: 'projects', name: 'Projetos', color: '#6366F1', icon: '🚀', createdAt: 0 },
    { id: 'study', name: 'Estudos', color: '#06B6D4', icon: '📚', createdAt: 0 },
    { id: 'personal', name: 'Pessoal', color: '#22C55E', icon: '👤', createdAt: 0 },
    { id: 'inspiration', name: 'Inspiração', color: '#F97316', icon: '✨', createdAt: 0 },
    { id: 'opportunities', name: 'Oportunidades', color: '#EAB308', icon: '🎯', createdAt: 0 },
    { id: 'other', name: 'Outros', color: '#71717A', icon: '✦', createdAt: 0 },
  ],
  ideaCollections: [],
  activeFocus: null,
  focusHistory: [],
};
