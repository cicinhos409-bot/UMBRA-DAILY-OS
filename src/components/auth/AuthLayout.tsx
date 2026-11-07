import React from 'react';
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  footerText: string;
  footerAction: string;
  onBack: () => void;
  onSwitchPage: () => void;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  eyebrow,
  title,
  description,
  footerText,
  footerAction,
  onBack,
  onSwitchPage,
  children,
}) => (
  <main className="min-h-screen bg-[#080808] text-white selection:bg-[#F59E0B]/30 selection:text-[#FBBF24]">
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-48 left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-[#F59E0B]/[0.07] blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#F59E0B]/[0.04] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
    </div>

    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
      <a
        href="/"
        onClick={(event) => {
          event.preventDefault();
          onBack();
        }}
        className="flex items-center gap-2.5 text-white"
        aria-label="Voltar para o UMBRA Daily OS"
      >
        <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B] shadow-[0_0_12px_#F59E0B]" />
        <span className="font-mono text-sm font-semibold tracking-wider">
          UMBRA <span className="font-normal text-[#A1A1AA]">DAILY OS</span>
        </span>
      </a>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#A1A1AA] transition-colors hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Voltar ao site</span>
        <span className="sm:hidden">Voltar</span>
      </button>
    </header>

    <div className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-center gap-12 px-5 pb-12 pt-4 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
      <section className="hidden max-w-xl lg:block">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/[0.07] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FBBF24]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
          Seu próximo passo começa aqui
        </span>
        <h1 className="mt-7 text-5xl font-extrabold leading-[1.08] tracking-tight xl:text-6xl">
          Menos intenção.
          <br />
          <span className="text-[#F59E0B]">Mais execução.</span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-[#A1A1AA]">
          Um espaço para organizar suas prioridades, proteger seu foco e avançar
          um dia de cada vez.
        </p>

        <div className="mt-10 space-y-4">
          {['Prioridades claras para o seu dia', 'Foco no que realmente importa', 'Progresso sem complicação'].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-[#D4D4D8]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B]">
                <Check className="h-3.5 w-3.5" />
              </span>
              {item}
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-3 border-t border-white/[0.08] pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[#71717A]">
          <span>Planeje</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#F59E0B]" />
          <span>Execute</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#F59E0B]" />
          <span>Repita</span>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-white/[0.09] bg-[#101010]/95 p-6 shadow-[0_24px_100px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-9">
          <div className="mb-7">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F59E0B]">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{description}</p>
          </div>

          {children}

          <div className="mt-7 border-t border-white/[0.08] pt-5 text-center text-sm text-[#A1A1AA]">
            {footerText}{' '}
            <button
              type="button"
              onClick={onSwitchPage}
              className="font-semibold text-[#F59E0B] transition-colors hover:text-[#FBBF24]"
            >
              {footerAction}
            </button>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-[#52525B]">
          UMBRA DAILY OS <span className="px-1.5 text-[#3F3F46]">·</span> Um dia de cada vez.
        </p>
      </section>
    </div>
  </main>
);
