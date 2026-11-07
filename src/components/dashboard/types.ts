export type TaskPriority = 'Urgente' | 'Alta' | 'Média' | 'Baixa';
export type TaskStatus = 'A fazer' | 'Em andamento' | 'Em revisão' | 'Concluído';
export type ProjectStatus = 'Ativo' | 'Em andamento' | 'Pausado' | 'Concluído';
export type ProjectPriority = TaskPriority;

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
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
}

export interface Idea {
  id: string;
  text: string;
  link: string;
  category: string;
  projectId: string;
  createdAt: number;
  attachmentName?: string;
  attachmentData?: string;
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
  tasks: DashboardTask[];
  dailyPriorityIds: string[];
  projects: DashboardProject[];
  schedule: ScheduleItem[];
  ideas: Idea[];
  activeFocus: ActiveFocusSession | null;
  focusHistory: FocusSession[];
}

export const initialDashboardState: DashboardState = {
  profileName: '',
  focusGoalMinutes: 120,
  onboardingComplete: false,
  mission: null,
  tasks: [],
  dailyPriorityIds: [],
  projects: [],
  schedule: [],
  ideas: [],
  activeFocus: null,
  focusHistory: [],
};
