import React, { useState } from 'react';
import { X, Play, Pause, Check, Sparkles, Send, ArrowRight, Clock, Target, Calendar } from 'lucide-react';
import { FeatureItem } from '../types';
import { useSound } from '../hooks/useSound';

interface FeatureDetailModalProps {
  feature: FeatureItem | null;
  onClose: () => void;
  onOpenCheckout: () => void;
}

export const FeatureDetailModal: React.FC<FeatureDetailModalProps> = ({
  feature,
  onClose,
  onOpenCheckout,
}) => {
  const { playClick, playTaskComplete } = useSound();

  // Mini-demo states
  const [demoTimer, setDemoTimer] = useState(25 * 60);
  const [demoTimerRunning, setDemoTimerRunning] = useState(false);

  const [morningChecklist, setMorningChecklist] = useState([
    { id: 1, text: 'Definir 1 Missão inegociável do dia', done: true },
    { id: 2, text: 'Não abrir redes sociais nos primeiros 45 minutos', done: true },
    { id: 3, text: 'Revisar as 3 prioridades antes de ler mensagens', done: false },
  ]);

  const [vaultIdea, setVaultIdea] = useState('');
  const [vaultSaved, setVaultSaved] = useState(false);

  if (!feature) return null;

  const toggleChecklist = (id: number) => {
    setMorningChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
    playTaskComplete();
  };

  const handleSaveDemoIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultIdea.trim()) return;
    setVaultSaved(true);
    playClick();
    setTimeout(() => {
      setVaultIdea('');
      setVaultSaved(false);
    }, 2000);
  };

  const formatSecs = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#121212] border border-[#2E2E2E] rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#71717A] hover:text-white rounded-full bg-[#181818] border border-[#262626] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Feature Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F59E0B] uppercase">
            <span>Categoria: {feature.category}</span>
            <span className="text-[#3F3F46]">·</span>
            <span className="text-[#A1A1AA]">Recurso Nativo</span>
          </div>
          <h3 className="text-2xl font-black text-white mt-1">
            {feature.title}
          </h3>
          <p className="text-sm text-[#A1A1AA] mt-2 leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* Interactive Mini-Demonstration Container */}
        <div className="bg-[#171717] border border-[#262626] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#222222]">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              Mini Demonstração Interativa
            </span>
            <span className="text-[10px] font-mono text-[#71717A]">Ambiente de Teste</span>
          </div>

          {/* Conditional mini demo based on feature category */}
          {feature.id === 'f-4' || feature.id === 'f-5' ? (
            /* Focus Timer demo */
            <div className="text-center py-3 space-y-3">
              <span className="text-xs text-[#A1A1AA]">Sessão de Concentração Ativa</span>
              <div className="text-5xl font-mono font-bold text-white tabular-nums">
                {formatSecs(demoTimer)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setDemoTimerRunning(!demoTimerRunning);
                    playClick();
                  }}
                  className="px-5 py-2 rounded-lg bg-[#F59E0B] text-black font-bold text-xs hover:bg-[#FBBF24] flex items-center gap-1.5 cursor-pointer"
                >
                  {demoTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{demoTimerRunning ? 'Pausar' : 'Iniciar'}</span>
                </button>
                <button
                  onClick={() => {
                    setDemoTimerRunning(false);
                    setDemoTimer(25 * 60);
                    playClick();
                  }}
                  className="px-3 py-2 text-xs text-[#71717A] hover:text-white border border-[#2A2A2A] rounded-lg"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : feature.id === 'f-3' ? (
            /* Checklist matinal demo */
            <div className="space-y-2">
              <span className="text-xs text-[#A1A1AA]">Protocolo Matinal de 3 Minutos:</span>
              {morningChecklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[#121212] border border-[#222222] hover:border-[#F59E0B]/40 cursor-pointer text-xs"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center ${
                      item.done ? 'bg-emerald-500 text-black' : 'border border-[#444444]'
                    }`}
                  >
                    {item.done && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={item.done ? 'line-through text-[#71717A]' : 'text-white'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          ) : feature.id === 'f-8' ? (
            /* Idea Vault demo */
            <form onSubmit={handleSaveDemoIdea} className="space-y-2.5">
              <span className="text-xs text-[#A1A1AA]">Captura rápida de ideia em foco:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vaultIdea}
                  onChange={(e) => setVaultIdea(e.target.value)}
                  placeholder="Ex: Roteiro para live de lançamento..."
                  className="flex-1 bg-[#121212] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F59E0B] text-black font-bold text-xs rounded-lg hover:bg-[#FBBF24] cursor-pointer"
                >
                  Salvar
                </button>
              </div>
              {vaultSaved && (
                <p className="text-[11px] text-emerald-400 font-mono">
                  ✓ Ideia arquivada com sucesso sem quebrar seu foco!
                </p>
              )}
            </form>
          ) : (
            /* General feature detail preview */
            <div className="space-y-2 text-xs text-[#D4D4D8]">
              <div className="p-3 bg-[#121212] rounded-lg border border-[#222222] flex items-center justify-between">
                <span>Modo de Execução</span>
                <span className="text-emerald-400 font-mono">Totalmente Integrado</span>
              </div>
              <div className="p-3 bg-[#121212] rounded-lg border border-[#222222] flex items-center justify-between">
                <span>Sincronização em Nuvem</span>
                <span className="text-[#F59E0B] font-mono">Automática</span>
              </div>
              <div className="p-3 bg-[#121212] rounded-lg border border-[#222222] flex items-center justify-between">
                <span>Disponível no Plano</span>
                <span className="text-white font-bold">R$ 9,90 / mês</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="text-xs text-[#71717A] hover:text-white transition-colors cursor-pointer"
          >
            Fechar detalhes
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenCheckout();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-extrabold text-xs transition-all shadow-md shadow-[#F59E0B]/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Assinar Plano Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
