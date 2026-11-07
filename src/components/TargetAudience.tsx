import React from 'react';
import { Briefcase, Video, Code, UserCheck, Lightbulb, CheckCircle2 } from 'lucide-react';
import { SpotlightCard } from './motion/SpotlightCard';
import { ScrollReveal } from './motion/ScrollReveal';
import { useSound } from '../hooks/useSound';

export const TargetAudience: React.FC = () => {
  const { playHover } = useSound();

  const audiences = [
    {
      role: 'EMPREENDEDORES',
      tagline: 'Organize negócios, projetos e objetivos sem perder o foco.',
      description: 'Lidere frentes estratégicas, alinhe prioridades da empresa e garanta que suas metas semanais saiam do papel.',
      icon: Briefcase,
      benefit: 'Visão executiva diária',
    },
    {
      role: 'CRIADORES DE CONTEÚDO',
      tagline: 'Planeje conteúdos, campanhas e produção criativa.',
      description: 'Agrupe roteiros, ideias e gravações sem se perder no mar de estímulos das próprias redes sociais.',
      icon: Video,
      benefit: 'Consistência criativa',
    },
    {
      role: 'DESENVOLVEDORES',
      tagline: 'Transforme projetos complexos em tarefas executáveis.',
      description: 'Estruture sprints pessoais, mantenha sessões ininterruptas de código profundo e documente ideias em segundos.',
      icon: Code,
      benefit: 'Flow state prolongado',
    },
    {
      role: 'PROFISSIONAIS & FREELANCERS',
      tagline: 'Organize compromissos, prioridades e entregas.',
      description: 'Elimine atrasos em projetos de clientes e preserve suas noites livres com planejamento matinal cirúrgico.',
      benefit: 'Prazos pontuais',
      icon: UserCheck,
    },
    {
      role: 'PESSOAS COM MUITAS IDEIAS',
      tagline: 'Capture tudo. Execute o que importa.',
      description: 'Guarde seus lampejos no Cofre de Ideias e force a mente a concluir uma coisa de cada vez antes de iniciar outra.',
      benefit: 'Fim do ciclo do abandono',
      icon: Lightbulb,
    },
  ];

  return (
    <section className="py-24 bg-[#080808] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#F59E0B] mb-3">
              Para quem busca consistência
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Feito para quem tem muito a construir.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#A1A1AA]">
              Se você tem ambições altas, múltiplos projetos e sente que seu potencial é bloqueado pela falta de um sistema diário de execução, o UMBRA é para você.
            </p>
          </div>
        </ScrollReveal>

        {/* 5 Audience Cards with Spotlight and 3D Tilt */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map((item, idx) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.role} delay={idx * 75}>
                <SpotlightCard
                  onMouseEnter={() => playHover()}
                  className={`p-6 flex flex-col justify-between h-full ${
                    idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono tracking-wider font-bold text-[#F59E0B]">
                        {item.role}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#282828] flex items-center justify-center text-[#A1A1AA] group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#FBBF24] transition-colors leading-snug">
                      {item.tagline}
                    </h3>
                    <p className="mt-2.5 text-xs text-[#A1A1AA] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#1F1F1F] flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.benefit}</span>
                  </div>
                </SpotlightCard>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
