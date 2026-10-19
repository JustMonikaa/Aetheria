// Cinematic procedural Web Audio soundscape for Aetheria
import { PathType } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Ambient soundscape nodes
  private masterAmbientGain: GainNode | null = null;
  private breezeFilter: BiquadFilterNode | null = null;
  private breezeGain: GainNode | null = null;
  private padOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  private isAmbientRunning: boolean = false;
  private lastWarningTime: number = 0;

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterAmbientGain && this.ctx) {
      this.masterAmbientGain.gain.setTargetAtTime(muted ? 0 : 0.04, this.ctx.currentTime, 0.2);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public startAmbient(path: PathType = 'Erudition') {
    if (this.isAmbientRunning) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      this.masterAmbientGain = ctx.createGain();
      this.masterAmbientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, ctx.currentTime);
      this.masterAmbientGain.connect(ctx.destination);

      // 1. Gentle Airflow / Cosmic Atmosphere (Soft filtered white noise with slow breathing)
      // Generates a 2-second looped pink-noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.06;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      this.breezeFilter = ctx.createBiquadFilter();
      this.breezeFilter.type = 'lowpass';
      this.breezeFilter.frequency.setValueAtTime(180, ctx.currentTime);
      this.breezeFilter.Q.setValueAtTime(1.0, ctx.currentTime);

      this.breezeGain = ctx.createGain();
      this.breezeGain.gain.setValueAtTime(0.02, ctx.currentTime);

      noiseSource.connect(this.breezeFilter);
      this.breezeFilter.connect(this.breezeGain);
      this.breezeGain.connect(this.masterAmbientGain);
      noiseSource.start();

      // 2. Warm, Soft Ethereal Pad (Filtered sine harmonics in gentle fifths, no harsh saw waves)
      const baseFreqs = [110, 164.81, 220]; // A2, E3, A3
      baseFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, ctx.currentTime);

        gain.gain.setValueAtTime(0.008, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterAmbientGain!);
        osc.start();

        this.padOscs.push({ osc, gain });
      });

      this.isAmbientRunning = true;
      this.updateAmbientForPath(path);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public updateAmbientForPath(path: PathType) {
    if (!this.ctx || !this.breezeFilter) return;
    const t = this.ctx.currentTime;
    switch (path) {
      case 'Destruction':
        this.breezeFilter.frequency.setTargetAtTime(280, t, 1.2);
        break;
      case 'Abundance':
        this.breezeFilter.frequency.setTargetAtTime(160, t, 1.2);
        break;
      case 'Hunt':
        this.breezeFilter.frequency.setTargetAtTime(220, t, 1.2);
        break;
      case 'Remembrance':
        this.breezeFilter.frequency.setTargetAtTime(200, t, 1.2);
        break;
      case 'Nihility':
        this.breezeFilter.frequency.setTargetAtTime(120, t, 1.2);
        break;
      default:
        this.breezeFilter.frequency.setTargetAtTime(180, t, 1.2);
        break;
    }
  }

  public playFootstep() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Soft sub-bass thud with quick decay, no high-pitch click
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.06);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, t);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playFlashlightClick(turnOn: boolean) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(turnOn ? 800 : 500, t);
    osc.frequency.exponentialRampToValueAtTime(turnOn ? 1200 : 350, t + 0.025);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  public playInteract() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Pleasant warm two-tone chime (G5 -> C6)
    [783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.setValueAtTime(0.06, t + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.28);
    });
  }

  public playSuccess() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Ascending harmonic chime: C5 - E5 - G5 - B5 - C6
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.5];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + delay);

      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.setValueAtTime(0.08, t + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.65);
    });
  }

  public playError() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  public playHydraulicHiss() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.3);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.3);
    filter.Q.setValueAtTime(2.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.31);
  }

  public playWaterSplash() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  public playOxygenWarning() {
    if (this.isMuted) return;
    const now = Date.now();
    // Throttle warning sound so it doesn't repeatedly ring every second
    if (now - this.lastWarningTime < 10000) return;
    this.lastWarningTime = now;

    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Gentle mellow chime pulse
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.setValueAtTime(440, t + 0.15);

    gain.gain.setValueAtTime(0, t);
    gain.gain.setValueAtTime(0.06, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.32);
  }
}

export const soundEngine = new SoundEngine();
