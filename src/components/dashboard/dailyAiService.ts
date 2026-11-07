import { createId } from './dashboardService';

export type DailyAiActionId =
  | 'organize_day'
  | 'prioritize_tasks'
  | 'recover_focus'
  | 'split_task'
  | 'replan_day'
  | 'productivity'
  | 'organize_ideas'
  | 'plan_project'
  | 'next_action'
  | 'review_projects';

export interface DailyAiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  actionId?: DailyAiActionId;
}

export interface DailyAiConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: DailyAiMessage[];
}

const STORAGE_KEY = 'umbra-daily-ai-v1';
const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES_PER_CONVERSATION = 100;
const MAX_MESSAGE_LENGTH = 12_000;

function isConversation(value: unknown): value is DailyAiConversation {
  if (!value || typeof value !== 'object') return false;
  const conversation = value as Partial<DailyAiConversation>;
  return typeof conversation.id === 'string'
    && typeof conversation.title === 'string'
    && typeof conversation.createdAt === 'number'
    && typeof conversation.updatedAt === 'number'
    && Array.isArray(conversation.messages)
    && conversation.messages.every((message) => (
      Boolean(message)
      && typeof message.id === 'string'
      && (message.role === 'user' || message.role === 'assistant')
      && typeof message.content === 'string'
      && typeof message.createdAt === 'number'
    ));
}

export const dailyAiService = {
  load(): DailyAiConversation[] {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(saved);
    } catch {
      throw new Error('O histórico local do Daily AI está inválido. Você pode limpá-lo nas opções do histórico.');
    }

    if (!Array.isArray(parsed) || !parsed.every(isConversation)) {
      throw new Error('O histórico local do Daily AI está em um formato inválido.');
    }

    return parsed
      .map((conversation) => ({
        ...conversation,
        messages: conversation.messages
          .slice(-MAX_MESSAGES_PER_CONVERSATION)
          .map((message) => ({ ...message, content: message.content.slice(0, MAX_MESSAGE_LENGTH) })),
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS);
  },

  save(conversations: DailyAiConversation[]): void {
    const limited = [...conversations]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS)
      .map((conversation) => ({
        ...conversation,
        messages: conversation.messages
          .slice(-MAX_MESSAGES_PER_CONVERSATION)
          .map((message) => ({ ...message, content: message.content.slice(0, MAX_MESSAGE_LENGTH) })),
      }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  },

  clear(): void {
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

export function createDailyAiConversation(title = 'Nova conversa'): DailyAiConversation {
  const now = Date.now();
  return { id: createId(), title, createdAt: now, updatedAt: now, messages: [] };
}

export function createDailyAiMessage(
  role: DailyAiMessage['role'],
  content: string,
  actionId?: DailyAiActionId,
): DailyAiMessage {
  return { id: createId(), role, content: content.slice(0, MAX_MESSAGE_LENGTH), createdAt: Date.now(), actionId };
}
