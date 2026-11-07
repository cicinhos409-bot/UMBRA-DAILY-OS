import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  CheckSquare,
  Timer,
  Clock,
  ListTodo,
  FolderKanban,
  Sparkles,
  Image,
  Calendar,
  Target,
  Flame,
  Cpu,
  BarChart3,
  RotateCcw,
  CalendarDays,
  History,
  Bell,
  Layers,
  UserCheck,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { FEATURES_LIST } from '../data/landingData';
import { FeatureItem } from '../types';
import { SpotlightCard } from './motion/SpotlightCard';
import { ScrollReveal } from './motion/ScrollReveal';
import { FeatureDetailModal } from './FeatureDetailModal';
import { useSound } from '../hooks/useSound';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  CalendarCheck2,
  CheckSquare,
  Timer,
  Clock,
  ListTodo,
  FolderKanban,
  Sparkles,
  Image,
  Calendar,
  Target,
  Flame,
  Cpu,
  BarChart3,
  RotateCcw,
  CalendarDays,
  History,
  Bell,
  Layers,
  UserCheck,
};

interface FeaturesGridProps {
  onOpenCheckout?: () => void;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ onOpenCheckout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);
  const { playClick, playHover } = useSound();

  const categories = ['Todos', 'Planejamento', 'Foco', 'Organização', 'Inteligência'];

  const filteredFeatures = FEATURES_LIST.filter((feature) => {
    const matchesCategory =
      selectedCategory === 'Todos' || feature.category === selectedCategory;
    const matchesSearch =
      feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCardClick = (feat: FeatureItem) => {
    playClick();
    setSelectedFeature(feat);
  };

  return (
    <section id="funcionalidades" className="py-24 bg-[#0A0A0A] border-t border-[#1F1F1F] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#F59E0B] mb-3">
              Conjunto completo de ferramentas
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Tudo o que você precisa para executar melhor.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#A1A1AA]">
              Sem ferramentas infladas ou funções confusas. Clique em qualquer card abaixo para testar a mini-demonstração interativa.
            </p>
          </div>
        </ScrollReveal>

        {/* Filter and Search Bar */}
        <ScrollReveal delay={100}>
          <div className="mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 max-w-4xl mx-auto">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#141414] border border-[#262626] rounded-xl self-start sm:self-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    playClick();
                    setSelectedCategory(cat);
                  }}
                  onMouseEnter={() => playHover()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#F59E0B] text-black font-bold'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#1E1E1E]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar funcionalidade..."
                className="w-full bg-[#141414] border border-[#262626] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>
        </ScrollReveal>

        {/* 20 Features Grid with SpotlightCard and Interactive Click to Expand */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredFeatures.map((feat, idx) => {
            const IconComponent = ICON_MAP[feat.iconName] || Sparkles;
            return (
              <ScrollReveal key={feat.id} delay={Math.min(idx * 30, 300)}>
                <SpotlightCard
                  onClick={() => handleCardClick(feat)}
                  onMouseEnter={() => playHover()}
                  className="p-5 flex flex-col justify-between h-full cursor-pointer hover:-translate-y-1 transition-transform"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-[#282828] flex items-center justify-center text-[#D4D4D8] group-hover:text-[#F59E0B] group-hover:border-[#F59E0B]/30 group-hover:scale-110 transition-all">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono text-[#71717A]">
                        {feat.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#FBBF24] transition-colors flex items-center justify-between">
                      <span>{feat.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#F59E0B] transition-colors" />
                    </h3>
                    <p className="mt-2 text-xs text-[#A1A1AA] leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1F1F1F] flex items-center justify-between text-[11px] text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">
                    <span>Clique para testar</span>
                    <ExternalLink className="w-3 h-3 group-hover:text-[#F59E0B] transition-colors" />
                  </div>
                </SpotlightCard>
              </ScrollReveal>
            );
          })}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-12 text-[#71717A] text-sm">
            Nenhuma funcionalidade encontrada para "{searchTerm}".
          </div>
        )}
      </div>

      {/* Feature Deep Dive Interactive Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        onClose={() => setSelectedFeature(null)}
        onOpenCheckout={onOpenCheckout || (() => {})}
      />
    </section>
  );
};
