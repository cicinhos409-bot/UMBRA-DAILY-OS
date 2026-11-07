import React from 'react';
import {
  Activity, Archive, CalendarDays, CheckSquare2, ChevronLeft, ChevronRight,
  CircleHelp, LayoutDashboard, LogOut, MoonStar, Settings2, Sparkles,
  Sun, Target, Timer, FolderKanban, type LucideIcon,
} from 'lucide-react';

export type DashboardModule =
  | 'Dashboard'
  | 'Minha manhã'
  | 'Missão de hoje'
  | 'Focus Mode'
  | 'Tarefas'
  | 'Projetos'
  | 'Cofre de ideias'
  | 'Calendário'
  | 'Métricas'
  | 'Daily AI'
  | 'Encerramento do dia'
  | 'Configurações';

const navigation: { label: DashboardModule; icon: LucideIcon }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Minha manhã', icon: Sun },
  { label: 'Missão de hoje', icon: Target },
  { label: 'Focus Mode', icon: Timer },
  { label: 'Tarefas', icon: CheckSquare2 },
  { label: 'Projetos', icon: FolderKanban },
  { label: 'Cofre de ideias', icon: Archive },
  { label: 'Calendário', icon: CalendarDays },
  { label: 'Métricas', icon: Activity },
  { label: 'Daily AI', icon: Sparkles },
  { label: 'Encerramento do dia', icon: MoonStar },
];

interface DashboardSidebarProps {
  activeModule: DashboardModule;
  collapsed: boolean;
  mobileOpen: boolean;
  profileName: string;
  onSelect: (module: DashboardModule) => void;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onExit: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeModule,
  collapsed,
  mobileOpen,
  profileName,
  onSelect,
  onToggleCollapsed,
  onCloseMobile,
  onExit,
}) => (
  <>
    {mobileOpen && (
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onCloseMobile}
        className="fixed inset-0 z-40 bg-black/70 lg:hidden"
      />
    )}
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/[0.07] bg-[#0B0B0B] transition-all duration-200 lg:translate-x-0 ${
        collapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex h-[72px] items-center justify-between border-b border-white/[0.07] px-5">
        <button type="button" onClick={() => onSelect('Dashboard')} className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-[#F59E0B] shadow-[0_0_12px_#F59E0B]" />
          {!collapsed && <span className="font-mono text-xs font-semibold tracking-wider">UMBRA <span className="font-normal text-[#A1A1AA]">DAILY OS</span></span>}
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden rounded-md p-1.5 text-[#71717A] transition-colors hover:bg-white/5 hover:text-white lg:block"
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav aria-label="Módulos" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navigation.map(({ label, icon: Icon }) => {
          const active = activeModule === label;
          return (
            <button
              type="button"
              key={label}
              onClick={() => {
                onSelect(label);
                onCloseMobile();
              }}
              title={collapsed ? label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
                active
                  ? 'bg-[#F59E0B]/[0.10] font-semibold text-[#FBBF24] ring-1 ring-inset ring-[#F59E0B]/15'
                  : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white'
              } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/[0.07] p-3">
        <button
          type="button"
          onClick={() => {
            onSelect('Configurações');
            onCloseMobile();
          }}
          title={collapsed ? 'Configurações' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white ${
            collapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <Settings2 className="h-[17px] w-[17px] shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </button>
        <div className={`flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? 'lg:justify-center' : ''}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 text-xs font-semibold text-[#FBBF24]">
            {profileName.trim().slice(0, 1).toUpperCase() || 'U'}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{profileName || 'Seu perfil local'}</p>
              <p className="mt-0.5 text-[10px] text-[#71717A]">Modo local</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onExit}
          title={collapsed ? 'Voltar ao site' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-[#71717A] transition-colors hover:bg-white/[0.04] hover:text-white ${
            collapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Voltar ao site</span>}
        </button>
        {!collapsed && (
          <p className="flex items-center gap-1.5 px-2 pt-1 text-[10px] text-[#52525B]">
            <CircleHelp className="h-3 w-3" />
            Dados salvos neste navegador
          </p>
        )}
      </div>
    </aside>
  </>
);
