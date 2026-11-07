import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Bell, Sliders, X, Sparkles } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

export const SoundController: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    soundEnabled,
    ambientEnabled,
    sfxEnabled,
    volume,
    toggleSound,
    toggleAmbient,
    toggleSfx,
    setVolume,
    playClick,
  } = useSound();

  const handleToggleMaster = () => {
    toggleSound();
  };

  return (
    <div className="fixed bottom-6 right-20 z-40">
      {/* Sound Settings Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-72 bg-[#121212]/95 backdrop-blur-xl border border-[#2E2E2E] rounded-2xl p-4 shadow-2xl shadow-black/80 space-y-4 animate-fadeIn">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#222222]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
              <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                UMBRA SOUND OS
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#71717A] hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Fechar painel de som"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Master Sound Switch */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Áudio Principal</p>
              <p className="text-[10px] text-[#A1A1AA]">Sons do sistema e ambientação</p>
            </div>
            <button
              onClick={handleToggleMaster}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                soundEnabled ? 'bg-[#F59E0B]' : 'bg-[#262626]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {soundEnabled && (
            <div className="space-y-3 pt-1 border-t border-[#1C1C1C]">
              {/* Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#A1A1AA] flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-[#F59E0B]" /> Volume
                  </span>
                  <span className="text-white font-mono">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#F59E0B] bg-[#222222] h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Generative Ambient Focus Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#181818] border border-[#282828]">
                <div className="flex items-center gap-2">
                  <Music className={`w-3.5 h-3.5 ${ambientEnabled ? 'text-[#F59E0B]' : 'text-[#71717A]'}`} />
                  <div>
                    <p className="text-xs font-medium text-white">Música Ambiente</p>
                    <p className="text-[10px] text-[#71717A]">Sintetizador 432Hz relaxante</p>
                  </div>
                </div>
                <button
                  onClick={toggleAmbient}
                  className={`text-[10px] font-mono px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    ambientEnabled
                      ? 'bg-[#F59E0B] text-black font-bold'
                      : 'bg-[#222222] text-[#A1A1AA]'
                  }`}
                >
                  {ambientEnabled ? 'ATIVO' : 'LIGAR'}
                </button>
              </div>

              {/* UI Sound Effects Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#181818] border border-[#282828]">
                <div className="flex items-center gap-2">
                  <Bell className={`w-3.5 h-3.5 ${sfxEnabled ? 'text-[#F59E0B]' : 'text-[#71717A]'}`} />
                  <div>
                    <p className="text-xs font-medium text-white">Feedback Sonoro</p>
                    <p className="text-[10px] text-[#71717A]">Cliques, timer e conclusão</p>
                  </div>
                </div>
                <button
                  onClick={toggleSfx}
                  className={`text-[10px] font-mono px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    sfxEnabled
                      ? 'bg-[#F59E0B] text-black font-bold'
                      : 'bg-[#222222] text-[#A1A1AA]'
                  }`}
                >
                  {sfxEnabled ? 'ATIVO' : 'LIGAR'}
                </button>
              </div>
            </div>
          )}

          {/* Micro-note */}
          <p className="text-[9px] text-[#555555] text-center font-mono">
            Áudio sintetizado dinamicamente via Web Audio API. Sem cookies externos.
          </p>
        </div>
      )}

      {/* Main Floating Sound Button */}
      <button
        onClick={() => {
          if (!soundEnabled) {
            handleToggleMaster();
          }
          setIsOpen(!isOpen);
        }}
        className={`group relative flex items-center gap-2 p-2.5 rounded-full border transition-all duration-300 shadow-xl cursor-pointer ${
          soundEnabled
            ? 'bg-[#151515] border-[#F59E0B]/60 text-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            : 'bg-[#151515]/90 border-[#262626] text-[#71717A] hover:text-white hover:border-[#383838]'
        }`}
        title={soundEnabled ? 'Opções de Som' : 'Ativar Experiência Sonora'}
        aria-label="Controle de Som"
      >
        {soundEnabled ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}

        {/* Animated wave bars when ambient is actively playing */}
        {soundEnabled && ambientEnabled && (
          <div className="flex items-center gap-0.5 h-3 px-0.5">
            <span className="w-0.5 bg-[#F59E0B] rounded-full animate-[waveBar_1.2s_ease-in-out_infinite]" />
            <span className="w-0.5 bg-[#F59E0B] rounded-full animate-[waveBar_0.8s_ease-in-out_0.2s_infinite]" />
            <span className="w-0.5 bg-[#F59E0B] rounded-full animate-[waveBar_1.4s_ease-in-out_0.4s_infinite]" />
          </div>
        )}
      </button>
    </div>
  );
};
