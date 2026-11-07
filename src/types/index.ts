export interface DailyTask {
  id: string;
  title: string;
  category: string;
  priority: 'alta' | 'média' | 'baixa';
  duration: string;
  completed: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  category: string;
  totalTasks: number;
  completedTasks: number;
  dueDate: string;
  status: 'Em andamento' | 'Quase concluído' | 'Planejado';
}

export interface IdeaItem {
  id: string;
  title: string;
  content: string;
  category: 'Produto' | 'Conteúdo' | 'Negócio' | 'Automação';
  date: string;
  priority: 'Explorar' | 'Prioritária' | 'Arquivo';
  tags: string[];
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  category: 'Planejamento' | 'Foco' | 'Organização' | 'Inteligência';
  iconName: string;
  highlight?: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
