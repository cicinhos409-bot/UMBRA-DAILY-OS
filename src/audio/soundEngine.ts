/**
 * UMBRA SOUND EXPERIENCE
 * High-performance, zero-asset Web Audio API sound synthesizer
 * Features generative ambient focus music and tactile UI micro-sounds.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  
  // Ambient nodes
  private ambientOscillators: OscillatorNode[] = [];
  private ambientLfo: OscillatorNode | null = null;
  private isAmbientPlaying: boolean = false;

  // Settings
  private soundEnabled: boolean = false;
  private sfxEnabled: boolean = true;
  private ambientEnabled: boolean = false;
  private masterVolume: number = 0.5;

  constructor() {
    // Load persisted preferences
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('umbra_sound_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.soundEnabled = parsed.soundEnabled ?? false;
          this.sfxEnabled = parsed.sfxEnabled ?? true;
          this.ambientEnabled = parsed.ambientEnabled ?? false;
          this.masterVolume = parsed.masterVolume ?? 0.5;
        }
      } catch (e) {
        // Fallback default
      }
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        
        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // SFX Gain
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // Ambient Gain
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public saveSettings() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'umbra_sound_settings',
          JSON.stringify({
            soundEnabled: this.soundEnabled,
            sfxEnabled: this.sfxEnabled,
            ambientEnabled: this.ambientEnabled,
            masterVolume: this.masterVolume,
          })
        );
      } catch (e) {}
    }
  }

  public setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
    this.saveSettings();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public isMasterSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public isSfxEnabled(): boolean {
    return this.soundEnabled && this.sfxEnabled;
  }

  public isAmbientEnabled(): boolean {
    return this.soundEnabled && this.ambientEnabled;
  }

  public toggleMasterSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    this.initContext();
    if (!this.soundEnabled) {
      this.stopAmbient();
    } else if (this.ambientEnabled) {
      this.startAmbient();
    }
    this.saveSettings();
    return this.soundEnabled;
  }

  public toggleSfx(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    this.saveSettings();
    return this.sfxEnabled;
  }

  public toggleAmbient(): boolean {
    this.initContext();
    this.ambientEnabled = !this.ambientEnabled;
    if (this.soundEnabled && this.ambientEnabled) {
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
    this.saveSettings();
    return this.ambientEnabled;
  }

  /**
   * Generative minimalist ambient focus soundscape
   * Continuous warm drone chord: A2 (110Hz), E3 (164.8Hz), A3 (220Hz), C#4 (277.2Hz)
   * With subtle LFO lowpass filter frequency breathing.
   */
  public startAmbient() {
    if (!this.soundEnabled || this.isAmbientPlaying) return;
    this.initContext();
    if (!this.ctx || !this.ambientGain) return;

    this.stopAmbient(); // Ensure clean slate

    try {
      // Warm low-pass filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      // Subtle LFO modulation on filter frequency (breathing pad effect)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 12.5s cycle
      lfoGain.gain.setValueAtTime(90, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.ambientLfo = lfo;

      // Focus chord notes: A minor 9 / A suspended warm pad
      const frequencies = [110.0, 164.81, 220.0, 277.18]; // A2, E3, A3, C#4

      this.ambientOscillators = frequencies.map((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const oscGain = this.ctx!.createGain();

        // Slight detune for analog warmth
        const detuneCents = (idx % 2 === 0 ? 1 : -1) * (3 + idx * 2);
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
        osc.detune.setValueAtTime(detuneCents, this.ctx!.currentTime);

        oscGain.gain.setValueAtTime(0.001, this.ctx!.currentTime);
        // Smooth 3-second fade in
        oscGain.gain.exponentialRampToValueAtTime(0.12 / frequencies.length, this.ctx!.currentTime + 3);

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        return osc;
      });

      filter.connect(this.ambientGain);
      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient synthesis failed', e);
    }
  }

  public stopAmbient() {
    if (!this.isAmbientPlaying) return;
    try {
      this.ambientOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      this.ambientOscillators = [];

      if (this.ambientLfo) {
        try {
          this.ambientLfo.stop();
          this.ambientLfo.disconnect();
        } catch (e) {}
        this.ambientLfo = null;
      }
    } catch (e) {}
    this.isAmbientPlaying = false;
  }

  /**
   * High-tactile micro sound effects
   */
  public playClick() {
    if (!this.soundEnabled || !this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  public playHover() {
    if (!this.soundEnabled || !this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.03);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }

  public playTaskComplete() {
    if (!this.soundEnabled || !this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      // Uplifting two-tone harmonic chime (F#5 739.99Hz -> A5 880Hz)
      [
        { freq: 739.99, delay: 0 },
        { freq: 880.0, delay: 0.09 },
      ].forEach(({ freq, delay }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + delay);
        osc.stop(now + delay + 0.38);
      });
    } catch (e) {}
  }

  public playTimerChime() {
    if (!this.soundEnabled || !this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      // Soft Tibetan-style bell overtone
      [440, 880, 1320].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const amp = 0.15 / (idx + 1);
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now);
        osc.stop(now + 1.0);
      });
    } catch (e) {}
  }

  public playTabSwitch() {
    if (!this.soundEnabled || !this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  public playModalOpen() {
    if (!this.soundEnabled || !this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }
}

export const soundEngine = new SoundEngine();
