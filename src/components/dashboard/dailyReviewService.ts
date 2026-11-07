import { createId } from './dashboardService';

export type PendingAction = 'tomorrow' | 'choose_date' | 'undated' | 'split' | 'cancel' | 'archive';

export interface DailyReview {
  id: string;
  reviewDate: string;
  step: number;
  status: 'draft' | 'completed';
  mainDelivery: string;
  biggestProgress: string;
  manualDeliveries: string[];
  missingPending: string;
  pendingActions: Record<string, { action: PendingAction; targetDate: string }>;
  productivityRating: number | null;
  difficulty: string;
  customDifficulty: string;
  focusRating: string;
  improvementNotes: string;
  lessonsLearned: string;
  ideaTitle: string;
  ideaContent: string;
  ideaType: string;
  ideaProjectId: string;
  ideaCategory: string;
  ideaTags: string;
  ideaSavedId: string;
  tomorrowMission: string;
  tomorrowPriorityIds: string[];
  firstTaskId: string;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'umbra-daily-reviews-v1';

export function createDailyReview(date: string): DailyReview {
  const now = Date.now();
  return {
    id: createId(),
    reviewDate: date,
    step: 0,
    status: 'draft',
    mainDelivery: '',
    biggestProgress: '',
    manualDeliveries: [],
    missingPending: '',
    pendingActions: {},
    productivityRating: null,
    difficulty: '',
    customDifficulty: '',
    focusRating: '',
    improvementNotes: '',
    lessonsLearned: '',
    ideaTitle: '',
    ideaContent: '',
    ideaType: 'Ideia',
    ideaProjectId: '',
    ideaCategory: '',
    ideaTags: '',
    ideaSavedId: '',
    tomorrowMission: '',
    tomorrowPriorityIds: [],
    firstTaskId: '',
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function isDailyReview(value: unknown): value is DailyReview {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<DailyReview>;
  return typeof item.id === 'string'
    && typeof item.reviewDate === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(item.reviewDate)
    && typeof item.step === 'number'
    && (item.status === 'draft' || item.status === 'completed')
    && typeof item.mainDelivery === 'string'
    && typeof item.updatedAt === 'number';
}

export const dailyReviewService = {
  load(): DailyReview[] {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(saved);
    } catch {
      throw new Error('O histórico de encerramentos está inválido.');
    }
    if (!Array.isArray(parsed) || !parsed.every(isDailyReview)) {
      throw new Error('O histórico de encerramentos está em um formato inválido.');
    }
    return parsed.sort((a, b) => b.reviewDate.localeCompare(a.reviewDate));
  },

  save(reviews: DailyReview[]): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  },

  clear(): void {
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
