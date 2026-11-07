import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive, ArrowUpRight, Check, Clock3, Copy, Download, FileText, FolderKanban,
  Grid2X2, Image, Inbox, Layers, Lightbulb, Link2, List, Plus, Search, Sparkles,
  Star, Tag, Trash2, Upload, X, RotateCcw,
} from 'lucide-react';
import { createId } from './dashboardService';
import type {
  DashboardProject, DashboardTask, Idea, IdeaAttachment, IdeaCategory, IdeaCollection,
  IdeaConversion, IdeaType, ProjectPriority, ProjectStatus, TaskPriority, TaskStatus,
} from './types';

const card = 'rounded-2xl border border-white/[0.08] bg-[#101010]';
const field = 'w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#F59E0B]/50';
const ideaTypes: IdeaType[] = ['Ideia', 'Anotação', 'Oportunidade', 'Referência', 'Pesquisa', 'Inspiração', 'Link', 'Material de estudo', 'Observação'];
const iconOptions = ['✦', '💡', '📌', '🔍', '✨', '📚', '🚀', '🎯', '📁'];
const priorities: TaskPriority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];
const taskStatuses: TaskStatus[] = ['A fazer', 'Em andamento', 'Em revisão', 'Concluído'];
const projectStatuses: ProjectStatus[] = ['Ativo', 'Em andamento', 'Pausado', 'Concluído'];
const maxAttachmentBytes = 1_000_000;
const allowedFileTypes: Record<string, string[]> = {
  png: ['image/png'], jpg: ['image/jpeg'], jpeg: ['image/jpeg'], gif: ['image/gif'], webp: ['image/webp'],
  pdf: ['application/pdf'], txt: ['text/plain'], md: ['text/markdown', 'text/plain'], csv: ['text/csv', 'text/plain'],
  doc: ['application/msword'], docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'], xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt: ['application/vnd.ms-powerpoint'], pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
};

type IdeaDraft = Omit<Idea, 'id' | 'createdAt'>;
type IdeaSection = 'all' | 'inbox' | 'favorites' | 'recent' | 'archived' | 'trash' | 'categories' | 'collections';
type IdeaView = 'cards' | 'list' | 'gallery';
type TaskConversion = Pick<DashboardTask, 'title' | 'description' | 'projectId' | 'priority' | 'dueAt' | 'estimatedMinutes' | 'category' | 'status'>;
type ProjectConversion = Pick<DashboardProject, 'name' | 'description' | 'objective' | 'category' | 'priority' | 'startAt' | 'dueAt' | 'status'>;

function validHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

function displayTitle(idea: Idea): string {
  if (idea.title?.trim()) return idea.title.trim();
  const source = idea.text || idea.link || idea.attachments?.[0]?.name || idea.attachmentName || 'Ideia sem título';
  return source.replace(/\s+/g, ' ').trim().slice(0, 76) || 'Ideia sem título';
}

function dateLabel(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(timestamp));
}

function defaultDraft(projectId = '', type: IdeaType = 'Ideia'): IdeaDraft {
  return {
    text: '',
    title: '',
    link: '',
    category: '',
    projectId,
    type,
    tags: [],
    collectionIds: [],
    favorite: false,
    status: 'inbox',
    updatedAt: Date.now(),
    archivedAt: null,
    deletedAt: null,
    attachments: [],
    conversionTaskIds: [],
    conversionProjectIds: [],
    conversions: [],
  };
}

function toDraft(idea: Idea): IdeaDraft {
  const { id: _id, createdAt: _createdAt, ...draft } = idea;
  return { ...defaultDraft(), ...draft, tags: [...(idea.tags || [])], collectionIds: [...(idea.collectionIds || [])], attachments: [...(idea.attachments || [])] };
}

function readFiles(files: FileList | File[], current: IdeaAttachment[], onDone: (attachments: IdeaAttachment[]) => void, onError: (message: string) => void) {
  const picked = Array.from(files);
  if (!picked.length) return;
  const room = 5 - current.length;
  if (picked.length > room) {
    onError('Cada ideia aceita até cinco anexos neste armazenamento local.');
    return;
  }
  if ([...current, ...picked].reduce((total, file) => total + file.size, 0) > maxAttachmentBytes) {
    onError('Os anexos de uma ideia não podem ultrapassar 1 MB no total neste armazenamento local.');
    return;
  }
  const invalid = picked.find((file) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return file.size > maxAttachmentBytes || !allowedFileTypes[extension] || Boolean(file.type && !allowedFileTypes[extension].includes(file.type));
  });
  if (invalid) {
    onError(`${invalid.name}: use um formato permitido e limite de 1 MB por arquivo.`);
    return;
  }
  Promise.all(picked.map((file) => new Promise<IdeaAttachment>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve({ id: createId(), name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, data: reader.result, createdAt: Date.now() })
      : reject(new Error(`Não foi possível ler ${file.name}.`));
    reader.onerror = () => reject(new Error(`Não foi possível ler ${file.name}.`));
    reader.readAsDataURL(file);
  }))).then((attachments) => {
    onError('');
    onDone([...current, ...attachments]);
  }).catch((error: unknown) => onError(error instanceof Error ? error.message : 'Falha ao carregar o anexo.'));
}

export const IdeaCaptureDialog: React.FC<{
  projects: DashboardProject[];
  categories: IdeaCategory[];
  initialType?: IdeaType;
  idea?: Idea | null;
  onClose: () => void;
  onSave: (draft: IdeaDraft, createAnother: boolean) => void;
}> = ({ projects, categories, idea, initialType = 'Ideia', onClose, onSave }) => {
  const [form, setForm] = useState<IdeaDraft>(() => idea ? toDraft(idea) : defaultDraft('', initialType));
  const [tagsText, setTagsText] = useState((idea?.tags || []).join(', '));
  const [attachmentError, setAttachmentError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const set = <K extends keyof IdeaDraft>(key: K, value: IdeaDraft[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (createAnother: boolean) => {
    const link = form.link.trim();
    if (!form.text.trim() && !link && !form.attachments?.length && !form.attachmentData) {
      setValidationError('Escreva a ideia, informe um link ou adicione um arquivo.');
      return;
    }
    if (link && !validHttpUrl(link)) {
      setValidationError('Informe um link válido começando com http:// ou https://.');
      return;
    }
    setValidationError('');
    onSave({
      ...form,
      title: form.title?.trim() || '',
      text: form.text.trim(),
      link,
      tags: [...new Set(tagsText.split(',').map((tag) => tag.trim()).filter(Boolean))].slice(0, 20),
      status: idea ? form.status : form.category || form.projectId || tagsText.trim() || form.collectionIds?.length ? 'organized' : form.status || 'inbox',
      attachmentName: undefined,
      attachmentData: undefined,
      updatedAt: Date.now(),
    }, createAnother);
    if (createAnother) {
      setForm(defaultDraft('', initialType));
      setTagsText('');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="idea-capture-title" className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#131313] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F59E0B]">{idea ? 'Editar registro' : 'Captura rápida'}</p><h2 id="idea-capture-title" className="mt-1 text-lg font-semibold text-white">{idea ? 'Editar ideia' : 'Capture agora. Organize depois.'}</h2><p className="mt-1 text-xs text-[#A1A1AA]">Título e organização são opcionais. Seus dados ficam neste navegador.</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-1.5 text-[#71717A] hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); submit(false); }}>
          <label className="block text-xs font-medium text-[#D4D4D8]">Título (opcional)<input autoFocus maxLength={140} value={form.title || ''} onChange={(event) => set('title', event.target.value)} placeholder="Um nome fácil de encontrar depois" className={`${field} mt-1.5`} /></label>
          <label className="block text-xs font-medium text-[#D4D4D8]">Conteúdo<textarea maxLength={10000} rows={5} value={form.text} onChange={(event) => set('text', event.target.value)} placeholder="Anote antes que escape..." className={`${field} mt-1.5 resize-y`} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#D4D4D8]">Tipo<select value={form.type || 'Ideia'} onChange={(event) => set('type', event.target.value as IdeaType)} className={`${field} mt-1.5`}>{ideaTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="block text-xs font-medium text-[#D4D4D8]">Categoria<select value={form.category} onChange={(event) => set('category', event.target.value)} className={`${field} mt-1.5`}><option value="">Organizar depois</option>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label>
          </div>
          <label className="block text-xs font-medium text-[#D4D4D8]">Link (opcional)<input type="url" value={form.link} onChange={(event) => set('link', event.target.value)} placeholder="https://" className={`${field} mt-1.5`} /><span className="mt-1 block text-[10px] text-[#71717A]">A captura funciona sem prévia automática. Metadados exigem um backend seguro ainda não configurado.</span></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#D4D4D8]">Projeto relacionado<select value={form.projectId} onChange={(event) => set('projectId', event.target.value)} className={`${field} mt-1.5`}><option value="">Sem projeto</option>{projects.filter((project) => !project.archivedAt).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
            <label className="block text-xs font-medium text-[#D4D4D8]">Etiquetas<input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="Pesquisa, futuro, validar" className={`${field} mt-1.5`} /><span className="mt-1 block text-[10px] text-[#71717A]">Separe as etiquetas por vírgula.</span></label>
          </div>
          <div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 text-xs text-[#A1A1AA] transition-colors hover:border-[#F59E0B]/40 hover:text-white" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); readFiles(event.dataTransfer.files, form.attachments || [], (items) => set('attachments', items), setAttachmentError); }}>
              <Upload className="h-4 w-4 text-[#FBBF24]" />Adicionar arquivos ou arrastar aqui<input type="file" multiple accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="sr-only" onChange={(event) => { if (event.target.files) readFiles(event.target.files, form.attachments || [], (items) => set('attachments', items), setAttachmentError); event.target.value = ''; }} />
            </label>
            <p className="mt-1.5 text-[10px] text-[#71717A]">Até cinco arquivos, 1 MB no total; ficam no navegador, não em storage privado.</p>
            {attachmentError && <p role="alert" className="mt-2 text-xs text-red-300">{attachmentError}</p>}
            {!!form.attachments?.length && <div className="mt-2 space-y-1">{form.attachments.map((file) => <div key={file.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-[#A1A1AA]"><span className="truncate">{file.name} · {(file.size / 1024).toFixed(0)} KB</span><button type="button" aria-label={`Remover ${file.name}`} onClick={() => set('attachments', (form.attachments || []).filter((item) => item.id !== file.id))} className="ml-3 text-[#71717A] hover:text-red-300"><X className="h-3.5 w-3.5" /></button></div>)}</div>}
          </div>
          {validationError && <p role="alert" className="text-xs text-red-300">{validationError}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.07] pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2.5 text-xs text-[#A1A1AA] hover:text-white">Cancelar</button>
            {!idea && <button type="button" onClick={() => submit(true)} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8] hover:bg-white/5">Salvar e criar outra</button>}
            <button type="submit" className="rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]">{idea ? 'Salvar alterações' : 'Salvar ideia'}</button>
          </div>
        </form>
      </section>
    </div>
  );
};

function ConversionDialog({ title, children, onClose, onSubmit }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return <div className="fixed inset-0 z-[85] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#131313] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{title}</h2><button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-1.5 text-[#71717A] hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button></div><form className="mt-5 space-y-4" onSubmit={onSubmit}>{children}<div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4"><button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs text-[#A1A1AA]">Cancelar</button><button type="submit" className="rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black">Confirmar criação</button></div></form></section></div>;
}

export const IdeaVaultPage: React.FC<{
  ideas: Idea[];
  categories: IdeaCategory[];
  collections: IdeaCollection[];
  projects: DashboardProject[];
  tasks: DashboardTask[];
  searchValue: string;
  onSearch: (query: string) => void;
  onCreate: (draft: IdeaDraft) => void;
  onUpdate: (idea: Idea) => void;
  onDeletePermanently: (idea: Idea) => void;
  onSaveCategory: (category: IdeaCategory) => void;
  onDeleteCategory: (category: IdeaCategory) => void;
  onSaveCollection: (collection: IdeaCollection) => void;
  onDeleteCollection: (collection: IdeaCollection) => void;
  onMoveCollection: (collectionId: string, direction: -1 | 1) => void;
  onCreateTask: (idea: Idea, task: TaskConversion) => void;
  onCreateProject: (idea: Idea, project: ProjectConversion) => void;
  onNavigate: (module: 'Tarefas' | 'Projetos', targetId?: string) => void;
  onNotify: (message: string) => void;
}> = ({
  ideas, categories, collections, projects, tasks, searchValue, onSearch, onCreate, onUpdate,
  onDeletePermanently, onSaveCategory, onDeleteCategory, onSaveCollection, onDeleteCollection,
  onMoveCollection, onCreateTask, onCreateProject, onNavigate, onNotify,
}) => {
  const [section, setSection] = useState<IdeaSection>('all');
  const [view, setView] = useState<IdeaView>('cards');
  const [sort, setSort] = useState('newest');
  const [pageSize, setPageSize] = useState(30);
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureType, setCaptureType] = useState<IdeaType>('Ideia');
  const [editing, setEditing] = useState<Idea | null>(null);
  const [details, setDetails] = useState<Idea | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [collectionFormOpen, setCollectionFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#F59E0B');
  const [categoryIcon, setCategoryIcon] = useState('✦');
  const [categoryFormError, setCategoryFormError] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionColor, setCollectionColor] = useState('#F59E0B');
  const [collectionIcon, setCollectionIcon] = useState('✦');
  const [collectionFormError, setCollectionFormError] = useState('');
  const [conversion, setConversion] = useState<'task' | 'project' | null>(null);

  const activeIdea = details ? ideas.find((idea) => idea.id === details.id) || details : null;
  const activeCollection = collections.find((collection) => collection.id === collectionFilter);
  const visibleIdeas = useMemo(() => {
    const query = searchValue.trim().toLocaleLowerCase('pt-BR');
    let result = ideas.filter((idea) => {
      const status = idea.status || 'inbox';
      if (section === 'trash' ? status !== 'trash' : status === 'trash') return false;
      if (section === 'archived' && status !== 'archived') return false;
      if (section !== 'archived' && status === 'archived') return false;
      if (section === 'inbox' && status !== 'inbox') return false;
      if (section === 'favorites' && !idea.favorite) return false;
      if (section === 'recent' && Date.now() - idea.createdAt > 30 * 86_400_000) return false;
      if (section === 'categories' && (!categoryFilter || idea.category !== categoryFilter)) return false;
      if (section === 'collections' && !(idea.collectionIds || []).includes(collectionFilter)) return false;
      if (categoryFilter && section !== 'categories' && idea.category !== categoryFilter) return false;
      if (collectionFilter && section !== 'collections' && !(idea.collectionIds || []).includes(collectionFilter)) return false;
      if (projectFilter && idea.projectId !== projectFilter) return false;
      if (typeFilter && (idea.type || 'Ideia') !== typeFilter) return false;
      if (!query) return true;
      const collectionNames = (idea.collectionIds || []).map((id) => collections.find((collection) => collection.id === id)?.name || '').join(' ');
      const projectName = projects.find((project) => project.id === idea.projectId)?.name || '';
      const attachmentNames = [...(idea.attachments || []).map((file) => file.name), idea.attachmentName || ''].join(' ');
      const domain = validHttpUrl(idea.link)?.hostname || '';
      return `${displayTitle(idea)} ${idea.text} ${idea.category} ${(idea.tags || []).join(' ')} ${collectionNames} ${projectName} ${attachmentNames} ${domain} ${idea.link}`.toLocaleLowerCase('pt-BR').includes(query);
    });
    result = [...result].sort((a, b) => {
      if (sort === 'oldest') return a.createdAt - b.createdAt;
      if (sort === 'alphabetical') return displayTitle(a).localeCompare(displayTitle(b), 'pt-BR');
      if (sort === 'updated') return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
      return b.createdAt - a.createdAt;
    });
    return result;
  }, [ideas, section, categoryFilter, collectionFilter, projectFilter, typeFilter, searchValue, sort, collections, projects]);

  const clearFilters = () => {
    onSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setProjectFilter('');
    setCollectionFilter('');
    setSection('all');
  };

  const updateIdea = (idea: Idea, changes: Partial<Idea>, message?: string) => {
    const updated = { ...idea, ...changes, updatedAt: Date.now() };
    onUpdate(updated);
    setDetails(updated);
    if (message) onNotify(message);
  };

  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const bulkUpdate = (changes: Partial<Idea>, message: string) => {
    visibleIdeas.filter((idea) => selectedIds.includes(idea.id)).forEach((idea) => onUpdate({ ...idea, ...changes, updatedAt: Date.now() }));
    setSelectedIds([]);
    onNotify(message);
  };

  const saveDraft = (draft: IdeaDraft, createAnother = false) => {
    if (editing) {
      const updated = { ...editing, ...draft, updatedAt: Date.now() };
      onUpdate(updated);
      setDetails(updated);
      setEditing(null);
      onNotify('Ideia atualizada.');
    } else {
      onCreate(draft);
      if (!createAnother) {
        setCaptureOpen(false);
        onNotify('Ideia salva na caixa de entrada.');
      }
    }
  };

  const openCapture = (type: IdeaType = 'Ideia') => { setEditing(null); setCaptureType(type); setCaptureOpen(true); };

  const createTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeIdea) return;
    const form = new FormData(event.currentTarget);
    onCreateTask(activeIdea, {
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || ''),
      projectId: String(form.get('projectId') || ''),
      priority: String(form.get('priority') || 'Média') as TaskPriority,
      dueAt: String(form.get('dueAt') || ''),
      estimatedMinutes: Math.max(1, Number(form.get('estimatedMinutes') || 25)),
      category: String(form.get('category') || ''),
      status: String(form.get('status') || 'A fazer') as TaskStatus,
    });
    setConversion(null);
    onNotify('Tarefa criada e vinculada à ideia original.');
  };

  const createProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeIdea) return;
    const form = new FormData(event.currentTarget);
    onCreateProject(activeIdea, {
      name: String(form.get('name') || '').trim(),
      description: String(form.get('description') || ''),
      objective: String(form.get('objective') || ''),
      category: String(form.get('category') || ''),
      priority: String(form.get('priority') || 'Média') as ProjectPriority,
      startAt: String(form.get('startAt') || ''),
      dueAt: String(form.get('dueAt') || ''),
      status: String(form.get('status') || 'Ativo') as ProjectStatus,
    });
    setConversion(null);
    onNotify('Projeto criado e vinculado à ideia original.');
  };

  const saveCategoryForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    if (categories.some((category) => category.id !== editingCategoryId && category.name.toLocaleLowerCase('pt-BR') === categoryName.trim().toLocaleLowerCase('pt-BR'))) {
      setCategoryFormError('Já existe uma categoria com esse nome.');
      return;
    }
    setCategoryFormError('');
    onSaveCategory({ id: editingCategoryId || createId(), name: categoryName.trim(), color: categoryColor, icon: categoryIcon, createdAt: categories.find((category) => category.id === editingCategoryId)?.createdAt || Date.now() });
    setCategoryName('');
    setEditingCategoryId('');
    setCategoryFormOpen(false);
    onNotify(editingCategoryId ? 'Categoria atualizada.' : 'Categoria criada.');
  };

  const saveCollectionForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!collectionName.trim()) return;
    if (collections.some((collection) => collection.id !== editingCollectionId && collection.name.toLocaleLowerCase('pt-BR') === collectionName.trim().toLocaleLowerCase('pt-BR'))) {
      setCollectionFormError('Já existe uma coleção com esse nome.');
      return;
    }
    setCollectionFormError('');
    const existing = collections.find((collection) => collection.id === editingCollectionId);
    onSaveCollection({ id: existing?.id || createId(), name: collectionName.trim(), description: collectionDescription.trim(), icon: collectionIcon, color: collectionColor, ideaIds: existing?.ideaIds || [], createdAt: existing?.createdAt || Date.now(), updatedAt: Date.now() });
    setCollectionName('');
    setCollectionDescription('');
    setEditingCollectionId('');
    setCollectionFormOpen(false);
    onNotify(existing ? 'Coleção atualizada.' : 'Coleção criada.');
  };

  const openNewCategory = () => {
    setCategoryName('');
    setCategoryColor('#F59E0B');
    setCategoryIcon('✦');
    setEditingCategoryId('');
    setCategoryFormError('');
    setCategoryFormOpen(true);
  };

  const openNewCollection = () => {
    setCollectionName('');
    setCollectionDescription('');
    setCollectionColor('#F59E0B');
    setCollectionIcon('✦');
    setEditingCollectionId('');
    setCollectionFormError('');
    setCollectionFormOpen(true);
  };

  const changeCollection = (idea: Idea, id: string, checked: boolean) => {
    const current = idea.collectionIds || [];
    updateIdea(idea, { collectionIds: checked ? [...new Set([...current, id])] : current.filter((item) => item !== id) }, checked ? 'Ideia adicionada à coleção.' : 'Ideia removida da coleção.');
  };

  const counts = {
    all: ideas.filter((idea) => idea.status !== 'trash' && idea.status !== 'archived').length,
    inbox: ideas.filter((idea) => (idea.status || 'inbox') === 'inbox').length,
    favorites: ideas.filter((idea) => idea.favorite && idea.status !== 'trash' && idea.status !== 'archived').length,
    archived: ideas.filter((idea) => idea.status === 'archived').length,
    trash: ideas.filter((idea) => idea.status === 'trash').length,
  };
  const pageIdeas = visibleIdeas.slice(0, pageSize);

  const sidebarItem = (key: IdeaSection, label: string, count?: number, icon?: React.ReactNode) => (
    <button type="button" key={key} onClick={() => { setSection(key); setSelectedIds([]); if (key !== 'categories') setCategoryFilter(''); if (key !== 'collections') setCollectionFilter(''); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${section === key ? 'bg-[#F59E0B]/10 text-[#FBBF24]' : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white'}`}>
      <span className="flex items-center gap-2">{icon}{label}</span>{count !== undefined && <span className="text-[10px] text-[#71717A]">{count}</span>}
    </button>
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F59E0B]">Capture agora. Organize depois.</p><h1 className="mt-2 text-2xl font-semibold text-white">Cofre de Ideias</h1><p className="mt-1 text-sm text-[#A1A1AA]">Suas ideias merecem mais do que ficar perdidas na sua cabeça.</p></div>
        <div className="flex items-center gap-2"><span className="rounded-full border border-white/10 px-3 py-2 text-[10px] text-[#A1A1AA]">{counts.all} armazenada(s)</span><button type="button" onClick={() => openCapture('Link')} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8] hover:border-white/20 hover:text-white"><Link2 className="h-3.5 w-3.5" />Salvar link</button><button type="button" onClick={() => openCapture()} className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#FBBF24]"><Plus className="h-4 w-4" />Capturar ideia</button></div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className={`${card} h-fit p-3`}>
          <nav aria-label="Seções do Cofre" className="space-y-1">
            {sidebarItem('all', 'Todas as ideias', counts.all, <Layers className="h-3.5 w-3.5" />)}
            {sidebarItem('inbox', 'Caixa de entrada', counts.inbox, <Inbox className="h-3.5 w-3.5" />)}
            {sidebarItem('favorites', 'Favoritas', counts.favorites, <Star className="h-3.5 w-3.5" />)}
            {sidebarItem('recent', 'Recentes', undefined, <Clock3 className="h-3.5 w-3.5" />)}
            {sidebarItem('archived', 'Arquivadas', counts.archived, <Archive className="h-3.5 w-3.5" />)}
            {sidebarItem('trash', 'Lixeira', counts.trash, <Trash2 className="h-3.5 w-3.5" />)}
          </nav>
          <div className="mt-4 border-t border-white/[0.07] pt-3">
            <div className="mb-1 flex items-center justify-between px-3"><p className="text-[10px] uppercase tracking-wider text-[#71717A]">Categorias</p><button type="button" onClick={openNewCategory} aria-label="Criar categoria" className="text-[#71717A] hover:text-[#FBBF24]"><Plus className="h-3.5 w-3.5" /></button></div>
            {categories.map((category) => <div key={category.id} className="group flex items-center gap-1"><button type="button" onClick={() => { setSection('categories'); setCategoryFilter(category.name); setCollectionFilter(''); }} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${section === 'categories' && categoryFilter === category.name ? 'text-[#FBBF24]' : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white'}`}><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: category.color }} /><span className="w-4 shrink-0 text-center">{category.icon || '✦'}</span><span className="truncate">{category.name}</span><span className="ml-auto text-[10px] text-[#52525B]">{ideas.filter((idea) => idea.category === category.name && idea.status !== 'trash').length}</span></button><button type="button" onClick={() => { setCategoryName(category.name); setCategoryColor(category.color); setCategoryIcon(category.icon || '✦'); setEditingCategoryId(category.id); setCategoryFormError(''); setCategoryFormOpen(true); }} aria-label={`Editar categoria ${category.name}`} className="px-1 text-[9px] text-[#52525B] hover:text-white">Editar</button></div>)}
            <button type="button" onClick={openNewCategory} className="mt-1 w-full px-3 py-1.5 text-left text-[10px] text-[#71717A] hover:text-[#FBBF24]">Gerenciar categorias</button>
          </div>
          <div className="mt-3 border-t border-white/[0.07] pt-3">
            <div className="mb-1 flex items-center justify-between px-3"><p className="text-[10px] uppercase tracking-wider text-[#71717A]">Coleções</p><button type="button" onClick={openNewCollection} aria-label="Criar coleção" className="text-[#71717A] hover:text-[#FBBF24]"><Plus className="h-3.5 w-3.5" /></button></div>
            {collections.map((collection) => <button key={collection.id} type="button" onClick={() => { setSection('collections'); setCollectionFilter(collection.id); setCategoryFilter(''); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${collectionFilter === collection.id ? 'text-[#FBBF24]' : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white'}`}><span className="w-4 text-center" style={{ color: collection.color }}>{collection.icon || '✦'}</span><span className="truncate">{collection.name}</span><span className="ml-auto text-[10px] text-[#52525B]">{collection.ideaIds.length}</span></button>)}
            {!collections.length && <p className="px-3 py-2 text-[10px] leading-4 text-[#52525B]">Crie coleções para agrupar ideias por assunto.</p>}
            <button type="button" onClick={openNewCollection} className="mt-1 w-full px-3 py-1.5 text-left text-[10px] text-[#71717A] hover:text-[#FBBF24]">Criar coleção</button>
          </div>
          <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"><p className="flex items-center gap-1.5 text-[10px] font-medium text-[#D4D4D8]"><Sparkles className="h-3 w-3 text-[#FBBF24]" />Organize com UMBRA AI</p><p className="mt-1.5 text-[10px] leading-4 text-[#71717A]">Indisponível: este projeto ainda não possui serviço de IA conectado. Nenhuma análise simulada será feita.</p></div>
        </aside>

        <section className={`${card} min-w-0 p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0A0A0A] px-3 py-2"><Search className="h-4 w-4 text-[#71717A]" /><input value={searchValue} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar título, conteúdo, etiqueta, projeto, link..." className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#52525B]" /></label>
            <select aria-label="Filtrar por tipo" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-2.5 py-2 text-[10px] text-[#A1A1AA]"><option value="">Todos os tipos</option>{ideaTypes.map((type) => <option key={type}>{type}</option>)}</select>
            <select aria-label="Filtrar por projeto" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="max-w-40 rounded-lg border border-white/10 bg-[#0A0A0A] px-2.5 py-2 text-[10px] text-[#A1A1AA]"><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
            <select aria-label="Ordenar ideias" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A0A0A] px-2.5 py-2 text-[10px] text-[#A1A1AA]"><option value="newest">Mais recentes</option><option value="oldest">Mais antigas</option><option value="alphabetical">Alfabética</option><option value="updated">Atualizadas</option></select>
            <div className="flex rounded-lg border border-white/10 p-0.5" aria-label="Visualização">{([['cards', Grid2X2], ['list', List], ['gallery', Image]] as const).map(([key, Icon]) => <button type="button" key={key} onClick={() => setView(key)} aria-label={`Visualização ${key}`} aria-pressed={view === key} className={`rounded-md p-1.5 ${view === key ? 'bg-white/10 text-[#FBBF24]' : 'text-[#71717A] hover:text-white'}`}><Icon className="h-3.5 w-3.5" /></button>)}</div>
          </div>

          {section === 'inbox' && <p className="mt-3 text-[11px] text-[#71717A]">{counts.inbox} ideia(s) aguardando organização. Nada será excluído ao organizar ou arquivar.</p>}
          {section === 'collections' && activeCollection && <div className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-lg bg-white/[0.03] p-3"><div><p className="text-xs font-medium text-white">{activeCollection.name}</p><p className="mt-1 text-[10px] text-[#71717A]">{activeCollection.description || 'Coleção de ideias'} · {activeCollection.ideaIds.length} ideia(s)</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => onMoveCollection(activeCollection.id, -1)} className="text-[10px] text-[#A1A1AA] hover:text-white">Subir</button><button type="button" onClick={() => onMoveCollection(activeCollection.id, 1)} className="text-[10px] text-[#A1A1AA] hover:text-white">Descer</button><button type="button" onClick={() => { setCollectionName(activeCollection.name); setCollectionDescription(activeCollection.description); setCollectionColor(activeCollection.color); setCollectionIcon(activeCollection.icon || '✦'); setEditingCollectionId(activeCollection.id); setCollectionFormError(''); setCollectionFormOpen(true); }} className="text-[10px] text-[#A1A1AA] hover:text-white">Editar</button><button type="button" onClick={() => { if (window.confirm(`Excluir a coleção “${activeCollection.name}”? As ideias serão preservadas.`)) { onDeleteCollection(activeCollection); setCollectionFilter(''); setSection('all'); } }} className="text-[10px] text-[#71717A] hover:text-red-300">Excluir coleção</button></div></div>}

          {section === 'inbox' && visibleIdeas.length > 0 && <label className="mt-3 inline-flex items-center gap-2 text-[10px] text-[#71717A]"><input type="checkbox" checked={pageIdeas.length > 0 && pageIdeas.every((idea) => selectedIds.includes(idea.id))} onChange={(event) => setSelectedIds(event.target.checked ? [...new Set([...selectedIds, ...pageIdeas.map((idea) => idea.id)])] : selectedIds.filter((id) => !pageIdeas.some((idea) => idea.id === id)))} className="accent-[#F59E0B]" />Selecionar ideias desta página</label>}

          {!!selectedIds.length && section !== 'trash' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/[0.04] p-2.5">
              <span className="mr-1 text-[10px] text-[#D4D4D8]">{selectedIds.length} selecionada(s)</span>
              <select aria-label="Definir categoria em lote" value="" onChange={(event) => { if (event.target.value) bulkUpdate({ category: event.target.value, status: 'organized' }, 'Ideias organizadas.'); }} className="rounded-md border border-white/10 bg-[#0A0A0A] px-2 py-1.5 text-[10px] text-[#A1A1AA]"><option value="">Definir categoria</option>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select>
              <button type="button" onClick={() => bulkUpdate({ favorite: true }, 'Ideias adicionadas às favoritas.')} className="rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-[#A1A1AA] hover:text-[#FBBF24]">Favoritar</button>
              <button type="button" onClick={() => bulkUpdate({ status: 'archived', archivedAt: Date.now() }, 'Ideias arquivadas.')} className="rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-[#A1A1AA]">Arquivar</button>
              <button type="button" onClick={() => setSelectedIds([])} className="ml-auto text-[10px] text-[#71717A]">Cancelar seleção</button>
            </div>
          )}

          {visibleIdeas.length ? (
            <div className={`mt-4 ${view === 'list' ? 'space-y-2' : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'}`}>
              {pageIdeas.map((idea) => {
                const image = (idea.attachments || []).find((file) => file.mimeType.startsWith('image/'));
                const url = validHttpUrl(idea.link);
                const project = projects.find((item) => item.id === idea.projectId);
                return (
                  <article key={idea.id} className={`group relative rounded-xl border border-white/[0.07] bg-white/[0.02] transition-all hover:border-[#F59E0B]/25 hover:bg-white/[0.035] ${view === 'list' ? 'flex items-center gap-3 p-3' : 'overflow-hidden p-4'}`}>
                    {view === 'gallery' && image && <img src={image.data} alt="" className="mb-3 aspect-[16/10] w-full rounded-lg object-cover" />}
                    <input type="checkbox" aria-label={`Selecionar ${displayTitle(idea)}`} checked={selectedIds.includes(idea.id)} onChange={() => toggleSelected(idea.id)} className="accent-[#F59E0B]" />
                    {view === 'cards' && image && <img src={image.data} alt="" className="mt-2 aspect-[16/10] w-full rounded-lg object-cover" />}
                    {view !== 'list' && <div className="mt-2 flex items-center justify-between gap-2"><span className="rounded-full border border-white/[0.08] px-2 py-1 text-[9px] text-[#A1A1AA]">{idea.type || 'Ideia'}</span><div className="flex items-center gap-1"><button type="button" onClick={() => updateIdea(idea, { favorite: !idea.favorite }, idea.favorite ? 'Removida das favoritas.' : 'Adicionada às favoritas.')} aria-label={idea.favorite ? 'Remover favorita' : 'Favoritar'} className={`rounded-md p-1.5 ${idea.favorite ? 'text-[#FBBF24]' : 'text-[#52525B] hover:text-[#FBBF24]'}`}><Star className={`h-3.5 w-3.5 ${idea.favorite ? 'fill-current' : ''}`} /></button><button type="button" onClick={() => updateIdea(idea, { status: 'archived', archivedAt: Date.now() }, 'Ideia arquivada.')} aria-label="Arquivar ideia" className="rounded-md p-1.5 text-[#52525B] hover:text-white"><Archive className="h-3.5 w-3.5" /></button></div></div>}
                    {view === 'list' && <div className="flex items-center gap-1"><button type="button" onClick={() => updateIdea(idea, { favorite: !idea.favorite }, idea.favorite ? 'Removida das favoritas.' : 'Adicionada às favoritas.')} aria-label={idea.favorite ? 'Remover favorita' : 'Favoritar'} className={`rounded-md p-1.5 ${idea.favorite ? 'text-[#FBBF24]' : 'text-[#52525B] hover:text-[#FBBF24]'}`}><Star className={`h-3.5 w-3.5 ${idea.favorite ? 'fill-current' : ''}`} /></button><button type="button" onClick={() => updateIdea(idea, { status: 'archived', archivedAt: Date.now() }, 'Ideia arquivada.')} aria-label="Arquivar ideia" className="rounded-md p-1.5 text-[#52525B] hover:text-white"><Archive className="h-3.5 w-3.5" /></button></div>}
                    <button type="button" onClick={() => setDetails(idea)} className={`block min-w-0 text-left ${view === 'list' ? 'flex-1' : 'mt-3 w-full'}`}><h2 className="truncate text-sm font-medium text-white">{displayTitle(idea)}</h2><p className={`mt-1 whitespace-pre-wrap text-xs leading-5 text-[#A1A1AA] ${view === 'list' ? 'line-clamp-1' : 'line-clamp-3'}`}>{idea.text || idea.link || idea.attachments?.[0]?.name || idea.attachmentName || 'Sem conteúdo adicional'}</p></button>
                    {view === 'list' && <div className="hidden items-center gap-2 text-[10px] text-[#71717A] sm:flex"><span>{idea.category || 'Sem categoria'}</span><span>{dateLabel(idea.createdAt)}</span></div>}
                    {view !== 'list' && <div className="mt-3 flex flex-wrap items-center gap-1.5">{idea.category && <span className="rounded-full bg-[#F59E0B]/10 px-2 py-1 text-[9px] text-[#FBBF24]">{idea.category}</span>}{(idea.tags || []).slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-white/[0.05] px-2 py-1 text-[9px] text-[#A1A1AA]">#{tag}</span>)}{(idea.attachments?.length || idea.attachmentName) && <span className="ml-auto flex items-center gap-1 text-[9px] text-[#71717A]"><FileText className="h-3 w-3" />{idea.attachments?.length || 1}</span>}</div>}
                    {url && <a href={url.href} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="mt-2 flex items-center gap-1 truncate text-[10px] text-[#FBBF24] hover:underline"><Link2 className="h-3 w-3 shrink-0" />{url.hostname}<ArrowUpRight className="h-3 w-3 shrink-0" /></a>}
                    {view !== 'list' && <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2 text-[9px] text-[#71717A]"><span className="truncate">{project?.name || 'Sem projeto'}</span><span>{dateLabel(idea.createdAt)}</span></div>}
                    {section === 'trash' && <div className="mt-2 flex gap-2"><button type="button" onClick={() => updateIdea(idea, { status: 'inbox', deletedAt: null, archivedAt: null }, 'Ideia restaurada.')} className="flex items-center gap-1 text-[10px] text-[#FBBF24]"><RotateCcw className="h-3 w-3" />Restaurar</button><button type="button" onClick={() => { if (window.confirm('Excluir esta ideia permanentemente? Tarefas e projetos vinculados serão preservados.')) onDeletePermanently(idea); }} className="flex items-center gap-1 text-[10px] text-red-300"><Trash2 className="h-3 w-3" />Excluir definitivamente</button></div>}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 px-5 py-14 text-center"><Lightbulb className="mx-auto h-6 w-6 text-[#52525B]" /><p className="mt-3 text-sm text-white">{searchValue || typeFilter || projectFilter || categoryFilter || collectionFilter ? 'Nenhuma ideia encontrada.' : section === 'inbox' ? 'Seu espaço está livre.' : section === 'favorites' ? 'Suas ideias favoritas aparecerão aqui.' : section === 'collections' ? 'Esta coleção ainda não tem ideias.' : section === 'trash' ? 'A lixeira está vazia.' : 'Seu espaço está livre.'}</p><p className="mt-1 text-xs text-[#71717A]">{section === 'inbox' ? 'Capture sua primeira ideia. Você não precisa organizar tudo agora.' : section === 'collections' ? 'Adicione ideias à coleção pelo painel de detalhes.' : 'Capture uma ideia e volte ao que estava fazendo.'}</p><div className="mt-4 flex justify-center gap-2">{(searchValue || typeFilter || projectFilter || categoryFilter || collectionFilter) && <button type="button" onClick={clearFilters} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#A1A1AA]">Limpar filtros</button>}{section !== 'trash' && <button type="button" onClick={() => openCapture()} className="rounded-lg bg-[#F59E0B] px-3 py-2 text-xs font-semibold text-black">Capturar ideia</button>}</div></div>
          )}
          {pageIdeas.length < visibleIdeas.length && <button type="button" onClick={() => setPageSize((size) => size + 30)} className="mt-4 w-full rounded-lg border border-white/10 py-2.5 text-xs text-[#A1A1AA] hover:border-white/20 hover:text-white">Carregar mais ideias</button>}
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#52525B]"><span>Dados persistidos localmente neste navegador; não há sincronização entre dispositivos.</span><span>Busca por texto disponível sem IA.</span></div>

      {captureOpen && <IdeaCaptureDialog projects={projects} categories={categories} idea={editing} initialType={captureType} onClose={() => { setCaptureOpen(false); setEditing(null); }} onSave={saveDraft} />}

      {activeIdea && (
        <div className="fixed inset-0 z-[75] flex justify-end bg-black/65 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetails(null); }}>
          <aside role="dialog" aria-modal="true" aria-label={`Detalhes: ${displayTitle(activeIdea)}`} className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#101010] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F59E0B]">Detalhes da ideia</p><h2 className="mt-1 text-xl font-semibold text-white">{displayTitle(activeIdea)}</h2></div><button type="button" onClick={() => setDetails(null)} aria-label="Fechar detalhes" className="rounded-lg p-2 text-[#71717A] hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button></div>
            <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[#A1A1AA]">{activeIdea.type || 'Ideia'}</span>{activeIdea.category && <span className="rounded-full bg-[#F59E0B]/10 px-2.5 py-1 text-[10px] text-[#FBBF24]">{activeIdea.category}</span>}<span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[#71717A]">{activeIdea.status === 'converted_task' ? 'Convertida em tarefa' : activeIdea.status === 'converted_project' ? 'Convertida em projeto' : activeIdea.status === 'archived' ? 'Arquivada' : activeIdea.status === 'trash' ? 'Na lixeira' : activeIdea.status === 'organized' ? 'Organizada' : 'Caixa de entrada'}</span></div>
            <div className="mt-5 whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm leading-7 text-[#D4D4D8]">{activeIdea.text || 'Sem anotação pessoal.'}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] text-[#71717A]"><p>Criada: {dateLabel(activeIdea.createdAt)}</p><p>Atualizada: {dateLabel(activeIdea.updatedAt || activeIdea.createdAt)}</p><p>Projeto: {projects.find((project) => project.id === activeIdea.projectId)?.name || 'Nenhum'}</p><p>Etiquetas: {(activeIdea.tags || []).join(', ') || 'Nenhuma'}</p></div>
            {activeIdea.link && validHttpUrl(activeIdea.link) && <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-white/[0.07] p-3"><a href={validHttpUrl(activeIdea.link)!.href} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-xs text-[#FBBF24]">{validHttpUrl(activeIdea.link)!.hostname} · {activeIdea.link}</a><button type="button" onClick={async () => { if (!navigator.clipboard?.writeText) { onNotify('A cópia não está disponível neste navegador.'); return; } try { await navigator.clipboard.writeText(activeIdea.link); onNotify('URL copiada.'); } catch { onNotify('Não foi possível copiar a URL.'); } }} className="flex items-center gap-1 text-[10px] text-[#A1A1AA]"><Copy className="h-3 w-3" />Copiar</button><span className="w-full text-[10px] text-[#52525B]">Prévia automática indisponível sem backend seguro.</span></div>}
            {!!activeIdea.attachments?.length && <div className="mt-4 space-y-2">{activeIdea.attachments.map((attachment) => <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] p-3">{attachment.mimeType.startsWith('image/') ? <img src={attachment.data} alt={attachment.name} className="h-12 w-12 rounded-md object-cover" /> : <FileText className="h-5 w-5 shrink-0 text-[#FBBF24]" />}<span className="min-w-0 flex-1 truncate text-xs text-[#D4D4D8]">{attachment.name} · {(attachment.size / 1024).toFixed(0)} KB</span><a href={attachment.data} download={attachment.name} className="text-[#A1A1AA] hover:text-white" aria-label={`Baixar ${attachment.name}`}><Download className="h-4 w-4" /></a></div>)}</div>}
            {collections.length > 0 && <fieldset className="mt-5 rounded-xl border border-white/[0.07] p-3"><legend className="px-1 text-[10px] text-[#A1A1AA]">Coleções</legend><div className="flex flex-wrap gap-x-4 gap-y-2">{collections.map((collection) => <label key={collection.id} className="flex items-center gap-1.5 text-[10px] text-[#A1A1AA]"><input type="checkbox" checked={(activeIdea.collectionIds || []).includes(collection.id)} onChange={(event) => changeCollection(activeIdea, collection.id, event.target.checked)} className="accent-[#F59E0B]" />{collection.name}</label>)}</div></fieldset>}
            {!!activeIdea.conversions?.length && <section className="mt-5"><h3 className="text-xs font-medium text-white">Conversões vinculadas</h3><div className="mt-2 space-y-1">{activeIdea.conversions.map((item: IdeaConversion) => { const task = item.type === 'task' ? tasks.find((candidate) => candidate.id === item.targetId) : undefined; const project = item.type === 'project' ? projects.find((candidate) => candidate.id === item.targetId) : undefined; return <button key={`${item.type}-${item.targetId}`} type="button" onClick={() => item.type === 'project' ? onNavigate('Projetos', item.targetId) : onNavigate('Tarefas', item.targetId)} className="block text-left text-[10px] text-[#FBBF24] hover:underline">{item.type === 'task' ? `Abrir tarefa: ${task?.title || 'Tarefa vinculada'}` : `Abrir projeto: ${project?.name || 'Projeto vinculado'}`}</button>; })}</div></section>}
            {!!activeIdea.activity?.length && <section className="mt-5 border-t border-white/[0.07] pt-4"><h3 className="text-xs font-medium text-white">Histórico de alterações</h3><ul className="mt-2 space-y-2">{activeIdea.activity.slice(0, 10).map((activity) => <li key={activity.id} className="flex items-start justify-between gap-3 text-[10px]"><span className="text-[#A1A1AA]">{activity.action}</span><time className="shrink-0 text-[#52525B]">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(activity.createdAt))}</time></li>)}</ul></section>}
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => { setEditing(activeIdea); setCaptureOpen(true); }} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8]">Editar</button>
              <button type="button" onClick={() => { onCreate({ ...toDraft(activeIdea), status: 'inbox', favorite: false, collectionIds: [], conversions: [], conversionTaskIds: [], conversionProjectIds: [], activity: [] }); onNotify('Cópia criada na caixa de entrada.'); }} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8]">Duplicar</button>
              <button type="button" onClick={() => updateIdea(activeIdea, { favorite: !activeIdea.favorite }, activeIdea.favorite ? 'Removida das favoritas.' : 'Adicionada às favoritas.')} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#D4D4D8]"><Star className={`h-3 w-3 ${activeIdea.favorite ? 'fill-[#FBBF24] text-[#FBBF24]' : ''}`} />Favoritar</button>
              <button type="button" onClick={() => { if (window.confirm('Mover esta ideia para a lixeira?')) { updateIdea(activeIdea, { status: 'trash', deletedAt: Date.now(), archivedAt: null }, 'Ideia movida para a lixeira.'); setDetails(null); } }} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#A1A1AA]">Excluir</button>
              <button type="button" onClick={() => { updateIdea(activeIdea, { status: activeIdea.status === 'archived' ? 'inbox' : 'archived', archivedAt: activeIdea.status === 'archived' ? null : Date.now() }, activeIdea.status === 'archived' ? 'Ideia restaurada.' : 'Ideia arquivada.'); }} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-[#A1A1AA]">{activeIdea.status === 'archived' ? 'Desarquivar' : 'Arquivar'}</button>
              <button type="button" onClick={() => { setConversion('task'); }} className="rounded-lg bg-[#F59E0B] px-3 py-2.5 text-xs font-semibold text-black">Transformar em tarefa</button>
              <button type="button" onClick={() => { setConversion('project'); }} className="rounded-lg border border-[#F59E0B]/30 px-3 py-2.5 text-xs text-[#FBBF24]">Transformar em projeto</button>
            </div>
          </aside>
        </div>
      )}

      {conversion === 'task' && activeIdea && <ConversionDialog title="Transformar ideia em tarefa" onClose={() => setConversion(null)} onSubmit={createTask}>
        <label className="block text-xs text-[#D4D4D8]">Título<input name="title" required maxLength={140} defaultValue={displayTitle(activeIdea)} className={`${field} mt-1.5`} /></label>
        <label className="block text-xs text-[#D4D4D8]">Descrição<textarea name="description" rows={3} defaultValue={activeIdea.text} className={`${field} mt-1.5`} /></label>
        <label className="block text-xs text-[#D4D4D8]">Projeto<select name="projectId" defaultValue={activeIdea.projectId} className={`${field} mt-1.5`}><option value="">Sem projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-xs text-[#D4D4D8]">Prioridade<select name="priority" defaultValue="Média" className={`${field} mt-1.5`}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label><label className="block text-xs text-[#D4D4D8]">Status<select name="status" defaultValue="A fazer" className={`${field} mt-1.5`}>{taskStatuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="block text-xs text-[#D4D4D8]">Prazo<input name="dueAt" type="date" className={`${field} mt-1.5`} /></label><label className="block text-xs text-[#D4D4D8]">Estimativa (min)<input name="estimatedMinutes" type="number" min="1" max="1440" defaultValue="25" className={`${field} mt-1.5`} /></label></div>
        <label className="block text-xs text-[#D4D4D8]">Categoria<input name="category" defaultValue={activeIdea.category} className={`${field} mt-1.5`} /></label>
      </ConversionDialog>}

      {conversion === 'project' && activeIdea && <ConversionDialog title="Transformar ideia em projeto" onClose={() => setConversion(null)} onSubmit={createProject}>
        <label className="block text-xs text-[#D4D4D8]">Nome do projeto<input name="name" required maxLength={80} defaultValue={displayTitle(activeIdea)} className={`${field} mt-1.5`} /></label>
        <label className="block text-xs text-[#D4D4D8]">Descrição<textarea name="description" rows={3} defaultValue={activeIdea.text} className={`${field} mt-1.5`} /></label>
        <label className="block text-xs text-[#D4D4D8]">Objetivo<textarea name="objective" rows={2} placeholder="Resultado esperado (opcional)" className={`${field} mt-1.5`} /></label>
        <label className="block text-xs text-[#D4D4D8]">Categoria<input name="category" defaultValue={activeIdea.category} className={`${field} mt-1.5`} /></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-xs text-[#D4D4D8]">Prioridade<select name="priority" defaultValue="Média" className={`${field} mt-1.5`}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label><label className="block text-xs text-[#D4D4D8]">Status<select name="status" defaultValue="Ativo" className={`${field} mt-1.5`}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="block text-xs text-[#D4D4D8]">Início<input name="startAt" type="date" className={`${field} mt-1.5`} /></label><label className="block text-xs text-[#D4D4D8]">Prazo<input name="dueAt" type="date" className={`${field} mt-1.5`} /></label></div>
      </ConversionDialog>}

      {categoryFormOpen && <ConversionDialog title={editingCategoryId ? 'Editar categoria' : 'Criar categoria'} onClose={() => { setCategoryFormOpen(false); setEditingCategoryId(''); setCategoryFormError(''); }} onSubmit={saveCategoryForm}><label className="block text-xs text-[#D4D4D8]">Nome<input autoFocus required maxLength={40} value={categoryName} onChange={(event) => { setCategoryName(event.target.value); setCategoryFormError(''); }} className={`${field} mt-1.5`} /></label><label className="block text-xs text-[#D4D4D8]">Ícone<select value={categoryIcon} onChange={(event) => setCategoryIcon(event.target.value)} className={`${field} mt-1.5`}>{iconOptions.map((icon) => <option key={icon}>{icon}</option>)}</select></label><label className="block text-xs text-[#D4D4D8]">Cor<input type="color" value={categoryColor} onChange={(event) => setCategoryColor(event.target.value)} className={`${field} mt-1.5 h-11 p-1`} /></label>{categoryFormError && <p role="alert" className="text-xs text-red-300">{categoryFormError}</p>}<div className="space-y-1">{categories.map((category) => <div key={category.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-[#D4D4D8]"><span>{category.name}</span><div className="flex gap-3"><button type="button" onClick={() => { setCategoryName(category.name); setCategoryColor(category.color); setCategoryIcon(category.icon || '✦'); setEditingCategoryId(category.id); setCategoryFormError(''); }} className="text-[#A1A1AA] hover:text-white">Editar</button><button type="button" onClick={() => { if (window.confirm(`Excluir a categoria “${category.name}”? As ideias serão preservadas sem categoria.`)) onDeleteCategory(category); }} className="text-[#71717A] hover:text-red-300">Excluir</button></div></div>)}</div></ConversionDialog>}

      {collectionFormOpen && <ConversionDialog title={editingCollectionId ? 'Editar coleção' : 'Criar coleção'} onClose={() => { setCollectionFormOpen(false); setEditingCollectionId(''); }} onSubmit={saveCollectionForm}><label className="block text-xs text-[#D4D4D8]">Nome<input autoFocus required maxLength={60} value={collectionName} onChange={(event) => { setCollectionName(event.target.value); setCollectionFormError(''); }} className={`${field} mt-1.5`} /></label><label className="block text-xs text-[#D4D4D8]">Descrição (opcional)<textarea rows={3} value={collectionDescription} onChange={(event) => setCollectionDescription(event.target.value)} className={`${field} mt-1.5`} /></label><label className="block text-xs text-[#D4D4D8]">Ícone<select value={collectionIcon} onChange={(event) => setCollectionIcon(event.target.value)} className={`${field} mt-1.5`}>{iconOptions.map((icon) => <option key={icon}>{icon}</option>)}</select></label><label className="block text-xs text-[#D4D4D8]">Cor<input type="color" value={collectionColor} onChange={(event) => setCollectionColor(event.target.value)} className={`${field} mt-1.5 h-11 p-1`} /></label>{collectionFormError && <p role="alert" className="text-xs text-red-300">{collectionFormError}</p>}</ConversionDialog>}
    </div>
  );
};
