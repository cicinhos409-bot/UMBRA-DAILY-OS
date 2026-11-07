export type AmbientKind = 'white' | 'brown';

class AmbientAudio {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private kind: AmbientKind | null = null;

  get isPlaying(): boolean {
    return this.source !== null;
  }

  async play(kind: AmbientKind, volume: number): Promise<void> {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) throw new Error('Este navegador não oferece suporte a áudio ambiente.');

    if (!this.context) this.context = new AudioContextConstructor();
    if (this.context.state === 'closed') this.context = new AudioContextConstructor();
    await this.context.resume();

    if (this.kind !== kind || !this.source || !this.gain) {
      this.stop();
      const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
      const samples = buffer.getChannelData(0);
      let brown = 0;
      for (let index = 0; index < samples.length; index += 1) {
        const noise = Math.random() * 2 - 1;
        brown = (brown + 0.02 * noise) / 1.02;
        samples[index] = kind === 'white' ? noise * 0.35 : brown * 3.5;
      }

      this.source = this.context.createBufferSource();
      this.source.buffer = buffer;
      this.source.loop = true;
      this.gain = this.context.createGain();
      this.gain.gain.value = Math.max(0, Math.min(1, volume));
      this.source.connect(this.gain);
      this.gain.connect(this.context.destination);
      this.source.start();
      this.kind = kind;
      return;
    }

    this.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.context.currentTime, 0.08);
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
    }
    this.gain?.disconnect();
    this.source = null;
    this.gain = null;
    this.kind = null;
  }
}

export const ambientAudio = new AmbientAudio();
