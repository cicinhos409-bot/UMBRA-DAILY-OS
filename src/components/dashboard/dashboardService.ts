import { initialDashboardState, type DashboardState } from './types';

const STORAGE_KEY = 'umbra-dashboard-v1';

export const dashboardService = {
  load(): DashboardState {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialDashboardState;

    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || !('tasks' in parsed) || !Array.isArray(parsed.tasks)) {
      throw new Error('Os dados locais do dashboard estão inválidos. Exporte ou redefina os dados para continuar.');
    }

    const state = parsed as Partial<DashboardState>;
    const today = localDateKey();
    const savedMission = state.mission;
    const savedIdeaCategories = (Array.isArray(state.ideaCategories) ? state.ideaCategories : initialDashboardState.ideaCategories)
      .map((category) => ({ ...category, icon: category.icon || '✦' }));
    const legacyIdeaCategories = [...new Set((Array.isArray(state.ideas) ? state.ideas : [])
      .map((idea) => (idea as DashboardState['ideas'][number]).category?.trim())
      .filter((name): name is string => Boolean(name))
      .filter((name) => !savedIdeaCategories.some((category) => category.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))))]
      .map((name) => ({
        id: `legacy-${name.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-')}`,
        name,
        color: '#71717A',
        icon: '✦',
        createdAt: 0,
      }));
    return {
      ...initialDashboardState,
      ...state,
      dailyPriorityIds: Array.isArray(state.dailyPriorityIds)
        ? [...new Set(state.dailyPriorityIds)].filter((id) => state.tasks!.some((task) => task.id === id && !task.archivedAt)).slice(0, 3)
        : state.tasks!.filter((task) => task.day === today && !task.archivedAt).slice(0, 3).map((task) => task.id),
      mission: savedMission
        ? savedMission.day && savedMission.day < today
          ? null
          : { ...savedMission, day: savedMission.day || today }
        : null,
      tasks: state.tasks!.map((task) => {
        const legacyTask = task as DashboardState['tasks'][number];
        return {
          ...legacyTask,
          day: legacyTask.day || today,
          dependsOnId: legacyTask.dependsOnId || '',
          description: legacyTask.description || '',
          category: legacyTask.category || '',
          tags: legacyTask.tags || [],
          status: legacyTask.status || (legacyTask.completed ? 'Concluído' : 'A fazer'),
          startAt: legacyTask.startAt || '',
          actualMinutes: legacyTask.actualMinutes || 0,
          actualSeconds: legacyTask.actualSeconds ?? (legacyTask.actualMinutes || 0) * 60,
          scheduledDay: legacyTask.scheduledDay || (legacyTask.scheduledAt ? legacyTask.day || today : ''),
          recurrence: legacyTask.recurrence || 'Não repetir',
          subtasks: legacyTask.subtasks || [],
          notes: legacyTask.notes || '',
          history: legacyTask.history || [],
          archivedAt: legacyTask.archivedAt || '',
          createdAt: legacyTask.createdAt || Date.now(),
          updatedAt: legacyTask.updatedAt || Date.now(),
        };
      }),
      projects: (state.projects || []).map((project) => {
        const legacyProject = project as DashboardState['projects'][number];
        return {
          ...legacyProject,
          objective: legacyProject.objective || '',
          category: legacyProject.category || '',
          color: legacyProject.color || '#F59E0B',
          icon: legacyProject.icon || 'folder',
          status: legacyProject.status || 'Ativo',
          priority: legacyProject.priority || 'Média',
          startAt: legacyProject.startAt || '',
          createdAt: legacyProject.createdAt || Date.now(),
          archivedAt: legacyProject.archivedAt || '',
          phases: legacyProject.phases || [],
          milestones: legacyProject.milestones || [],
          activity: legacyProject.activity || [],
          files: legacyProject.files || [],
        };
      }),
      schedule: Array.isArray(state.schedule)
        ? state.schedule.map((item) => ({ ...item, day: item.day || today, durationMinutes: Math.max(1, Number(item.durationMinutes) || 30), type: item.type || 'Personalizado', description: item.description || '', taskId: item.taskId || '', projectId: item.projectId || '', notes: item.notes || '' }))
        : [],
      ideas: Array.isArray(state.ideas)
        ? state.ideas.map((idea) => {
            const legacyIdea = idea as DashboardState['ideas'][number];
            const attachments = Array.isArray(legacyIdea.attachments) ? legacyIdea.attachments : [];
            const legacyAttachment = legacyIdea.attachmentName && legacyIdea.attachmentData
              ? [{
                  id: `legacy-${legacyIdea.id}`,
                  name: legacyIdea.attachmentName,
                  mimeType: 'application/octet-stream',
                  size: 0,
                  data: legacyIdea.attachmentData,
                  createdAt: legacyIdea.createdAt || Date.now(),
                }]
              : [];
            const hasLink = Boolean(legacyIdea.link);
            return {
              ...legacyIdea,
              title: legacyIdea.title || '',
              text: legacyIdea.text || '',
              link: legacyIdea.link || '',
              category: legacyIdea.category || '',
              projectId: legacyIdea.projectId || '',
              type: legacyIdea.type || (hasLink && !legacyIdea.text ? 'Link' : 'Ideia'),
              tags: Array.isArray(legacyIdea.tags) ? legacyIdea.tags : [],
              collectionIds: Array.isArray(legacyIdea.collectionIds) ? legacyIdea.collectionIds : [],
              favorite: Boolean(legacyIdea.favorite),
              status: legacyIdea.status || (legacyIdea.deletedAt ? 'trash' : legacyIdea.archivedAt ? 'archived' : 'inbox'),
              createdAt: legacyIdea.createdAt || Date.now(),
              updatedAt: legacyIdea.updatedAt || legacyIdea.createdAt || Date.now(),
              archivedAt: legacyIdea.archivedAt || null,
              deletedAt: legacyIdea.deletedAt || null,
              attachments: [...attachments, ...legacyAttachment],
              conversionTaskIds: Array.isArray(legacyIdea.conversionTaskIds) ? legacyIdea.conversionTaskIds : [],
              conversionProjectIds: Array.isArray(legacyIdea.conversionProjectIds) ? legacyIdea.conversionProjectIds : [],
              conversions: Array.isArray(legacyIdea.conversions) ? legacyIdea.conversions : [],
              activity: Array.isArray(legacyIdea.activity) ? legacyIdea.activity : [],
            };
          })
        : [],
      ideaCategories: [...savedIdeaCategories, ...legacyIdeaCategories],
      ideaCollections: Array.isArray(state.ideaCollections)
        ? state.ideaCollections.map((collection) => ({
            ...collection,
            ideaIds: Array.isArray(collection.ideaIds) ? collection.ideaIds : [],
            updatedAt: collection.updatedAt || collection.createdAt || Date.now(),
          }))
        : [],
      focusHistory: Array.isArray(state.focusHistory)
        ? state.focusHistory.map((session) => ({
            ...session,
            projectId: session.projectId || null,
            endedAt: session.endedAt || session.startedAt + session.durationMinutes * 60_000,
            status: session.status || (session.completed ? 'Concluída' : 'Interrompida'),
            targetDurationSeconds: session.targetDurationSeconds ?? session.durationMinutes * 60,
            actualFocusSeconds: session.actualFocusSeconds ?? session.durationMinutes * 60,
            breakSeconds: session.breakSeconds || 0,
            concentrationRating: session.concentrationRating || null,
            notes: session.notes || '',
          }))
        : [],
    };
  },

  save(state: DashboardState): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  clear(): void {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem('umbra-daily-ai-v1');
    window.localStorage.removeItem('umbra-planner-preferences-v1');
    window.localStorage.removeItem('umbra-daily-reviews-v1');
  },
};

export function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
