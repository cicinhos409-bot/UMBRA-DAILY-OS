import React, { useState } from 'react';
import { Bell, Menu, Plus, Search, X } from 'lucide-react';
import type { DashboardModule } from './DashboardSidebar';

interface DashboardHeaderProps {
  profileName: string;
  activeModule: DashboardModule;
  alertMessages: string[];
  searchValue: string;
  onCaptureIdea: () => void;
  onSearch: (query: string) => void;
  onOpenMenu: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  profileName,
  activeModule,
  alertMessages,
  searchValue,
  onCaptureIdea,
  onSearch,
  onOpenMenu,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const date = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080808]/90 backdrop-blur-xl">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onOpenMenu} className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-white lg:hidden" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {activeModule === 'Dashboard' ? `${greeting}${profileName ? `, ${profileName.split(' ')[0]}` : ''}` : activeModule}
            </p>
            <p className="mt-0.5 hidden text-[11px] capitalize text-[#71717A] sm:block">
              {activeModule === 'Dashboard' ? date : 'Seu espaço de execução'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <label className="hidden h-9 w-48 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 focus-within:border-[#F59E0B]/40 md:flex xl:w-60">
            <Search className="h-4 w-4 shrink-0 text-[#71717A]" />
            <input
              type="search"
              placeholder="Buscar tarefas..."
              value={searchValue}
              onChange={(event) => onSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#52525B]"
              aria-label="Buscar tarefas"
            />
          </label>

          <button type="button" onClick={() => setSearchOpen((open) => !open)} className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-white md:hidden" aria-label={searchOpen ? 'Fechar busca' : 'Buscar tarefas'} aria-expanded={searchOpen}>
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onCaptureIdea}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#F59E0B] px-3 text-xs font-semibold text-black transition-colors hover:bg-[#FBBF24] sm:px-3.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Capturar ideia</span>
            <span className="sm:hidden">Ideia</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative rounded-lg p-2 text-[#A1A1AA] transition-colors hover:bg-white/5 hover:text-white"
              aria-label={`Notificações${alertMessages.length ? `, ${alertMessages.length} pendências` : ''}`}
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-[18px] w-[18px]" />
              {alertMessages.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#F59E0B]" />}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-[#151515] p-4 shadow-2xl">
                <p className="text-sm font-semibold text-white">O que precisa de atenção</p>
                {alertMessages.length ? (
                  <ul className="mt-3 space-y-2">
                    {alertMessages.map((message) => <li key={message} className="rounded-lg bg-white/[0.035] px-3 py-2 text-xs leading-5 text-[#A1A1AA]">{message}</li>)}
                  </ul>
                ) : <p className="mt-2 text-xs text-[#71717A]">Nenhuma pendência importante por enquanto.</p>}
              </div>
            )}
          </div>

          <span className="hidden h-8 w-8 items-center justify-center rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 text-xs font-semibold text-[#FBBF24] sm:flex" aria-label={profileName || 'Perfil local'}>
            {profileName.trim().slice(0, 1).toUpperCase() || 'U'}
          </span>
        </div>
      </div>
      {searchOpen && (
        <div className="absolute left-4 right-4 top-[calc(100%+0.5rem)] z-40 flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-[#151515] px-3 shadow-xl md:hidden">
          <Search className="h-4 w-4 shrink-0 text-[#71717A]" />
          <input autoFocus type="search" value={searchValue} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar tarefas..." className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#52525B]" />
        </div>
      )}
    </header>
  );
};
