import { useState, useEffect } from 'react';
import { soundEngine } from '../audio/soundEngine';

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(soundEngine.isMasterSoundEnabled());
  const [ambientEnabled, setAmbientEnabled] = useState(soundEngine.isAmbientEnabled());
  const [sfxEnabled, setSfxEnabled] = useState(soundEngine.isSfxEnabled());
  const [volume, setVolume] = useState(soundEngine.getMasterVolume());

  useEffect(() => {
    // Sync state
    setSoundEnabled(soundEngine.isMasterSoundEnabled());
    setAmbientEnabled(soundEngine.isAmbientEnabled());
    setSfxEnabled(soundEngine.isSfxEnabled());
    setVolume(soundEngine.getMasterVolume());
  }, []);

  const toggleSound = () => {
    const next = soundEngine.toggleMasterSound();
    setSoundEnabled(next);
    setAmbientEnabled(soundEngine.isAmbientEnabled());
    if (next) soundEngine.playClick();
  };

  const toggleAmbient = () => {
    const next = soundEngine.toggleAmbient();
    setAmbientEnabled(next);
  };

  const toggleSfx = () => {
    const next = soundEngine.toggleSfx();
    setSfxEnabled(next);
  };

  const updateVolume = (val: number) => {
    soundEngine.setMasterVolume(val);
    setVolume(val);
  };

  return {
    soundEnabled,
    ambientEnabled,
    sfxEnabled,
    volume,
    toggleSound,
    toggleAmbient,
    toggleSfx,
    setVolume: updateVolume,
    playClick: () => soundEngine.playClick(),
    playHover: () => soundEngine.playHover(),
    playTaskComplete: () => soundEngine.playTaskComplete(),
    playTimerChime: () => soundEngine.playTimerChime(),
    playTabSwitch: () => soundEngine.playTabSwitch(),
    playModalOpen: () => soundEngine.playModalOpen(),
  };
}
