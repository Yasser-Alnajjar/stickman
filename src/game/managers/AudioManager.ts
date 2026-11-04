import type { MusicTrack, SfxName } from '@/shared/types';

export interface AudioSettings { master: number; music: number; sfx: number; muted: boolean }
const STORAGE_KEY = 'stickman.audio.v1';
export const DEFAULT_AUDIO: AudioSettings = { master: 0.8, music: 0.5, sfx: 0.8, muted: false };

const midi = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);

interface Pattern { bpm: number; bass: (number | null)[]; lead: (number | null)[]; kick: number[]; snare: number[]; hat: number[]; root: number }

const TRACKS: Record<Exclude<MusicTrack, 'none'>, Pattern> = {
  city: {
    bpm: 96, root: 45,
    bass: [0, null, 0, null, 3, null, 0, null, 5, null, 5, null, 3, null, 7, null],
    lead: [null, null, 12, null, null, 15, null, 12, null, null, 17, null, 15, null, 12, null],
    kick: [0, 6, 8, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  boss: {
    bpm: 148, root: 40,
    bass: [0, 0, null, 0, 1, null, 0, 0, 3, 3, null, 3, 1, null, 0, null],
    lead: [12, null, 13, null, 12, null, 15, null, 17, null, 15, null, 13, null, 12, 10],
    kick: [0, 3, 4, 8, 10, 12], snare: [4, 12, 15], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
};

/** Centralised, fully synthesised audio (WebAudio). No asset files; unlocked on first user interaction. */
class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private musicGain!: GainNode;
  private sfxGain!: GainNode;
  private noise: AudioBuffer | null = null;
  settings: AudioSettings = { ...DEFAULT_AUDIO };
  private track: MusicTrack = 'none';
  private step = 0;
  private nextStepTime = 0;
  private timer: number | null = null;
  private lastPlayed = new Map<SfxName, number>();
  private unlockHandler = (): void => { this.unlock(); };

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const o = JSON.parse(raw) as Partial<AudioSettings>;
        const n = (v: unknown, d: number): number => (typeof v === 'number' && v >= 0 && v <= 1 ? v : d);
        this.settings = { master: n(o.master, DEFAULT_AUDIO.master), music: n(o.music, DEFAULT_AUDIO.music), sfx: n(o.sfx, DEFAULT_AUDIO.sfx), muted: o.muted === true };
      }
    } catch { /* ignore corrupted settings */ }
  }

  /** Call once: unlocks the context on the first gesture (browser autoplay policy). */
  installUnlockListeners(): () => void {
    const evs = ['pointerdown', 'keydown', 'touchstart'] as const;
    evs.forEach((e) => window.addEventListener(e, this.unlockHandler, { passive: true }));
    return () => evs.forEach((e) => window.removeEventListener(e, this.unlockHandler));
  }

  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.applyVolumes();
        if (this.track !== 'none') this.startScheduler();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch (e) {
      console.warn('[audio] unavailable', e);
    }
  }

  set(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings)); } catch { /* storage unavailable */ }
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const m = this.settings.muted ? 0 : this.settings.master;
    this.masterGain.gain.setTargetAtTime(m, t, 0.02);
    this.musicGain.gain.setTargetAtTime(this.settings.music * 0.5, t, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfx, t, 0.02);
  }

  /* ---------------------------- music ---------------------------- */

  playMusic(track: MusicTrack): void {
    if (track === this.track) return;
    this.track = track;
    this.step = 0;
    if (this.ctx) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
      if (track === 'none') this.stopScheduler();
      else this.startScheduler();
    }
  }

  private startScheduler(): void {
    if (this.timer !== null || !this.ctx) return;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }

  private stopScheduler(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || this.track === 'none') return;
    if (ctx.state !== 'running') { this.nextStepTime = ctx.currentTime + 0.05; return; }
    const pat = TRACKS[this.track];
    const stepDur = 60 / pat.bpm / 4;
    while (this.nextStepTime < ctx.currentTime + 0.15) {
      this.musicStep(pat, this.step % 16, this.nextStepTime, stepDur);
      this.nextStepTime += stepDur;
      this.step++;
    }
  }

  private musicStep(p: Pattern, s: number, t: number, dur: number): void {
    const bass = p.bass[s];
    if (bass !== null && bass !== undefined) this.tone(midi(p.root + bass), t, dur * 1.8, 'sawtooth', 0.22, this.musicGain, 420);
    const lead = p.lead[s];
    if (lead !== null && lead !== undefined) this.tone(midi(p.root + 12 + lead), t, dur * 1.4, 'square', 0.06, this.musicGain, 2200);
    if (p.kick.includes(s)) this.kick(t);
    if (p.snare.includes(s)) this.noiseHit(t, 0.12, 0.2, 1800, 'bandpass', this.musicGain);
    if (p.hat.includes(s)) this.noiseHit(t, 0.03, 0.07, 7000, 'highpass', this.musicGain);
  }

  private kick(t: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g).connect(this.musicGain);
    o.start(t); o.stop(t + 0.18);
  }

  /* ---------------------------- primitives ---------------------------- */

  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode, cutoff = 4000, slideTo?: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    f.type = 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private noiseHit(t: number, dur: number, vol: number, freq: number, type: BiquadFilterType, dest: AudioNode, sweepTo?: number): void {
    const ctx = this.ctx!;
    if (!this.noise) return;
    const src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    f.type = type; f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  /* ---------------------------- sfx ---------------------------- */

  play(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || this.settings.muted) return;
    const now = ctx.currentTime;
    const last = this.lastPlayed.get(name) ?? 0;
    if (now - last < 0.035) return; // voice limiting against spam
    this.lastPlayed.set(name, now);
    const d = this.sfxGain, t = now;
    const r = (a: number, b: number): number => a + Math.random() * (b - a);
    switch (name) {
      case 'step': this.noiseHit(t, 0.05, 0.08, r(500, 900), 'lowpass', d); break;
      case 'jump': this.tone(r(260, 300), t, 0.18, 'sine', 0.2, d, 3000, 520); break;
      case 'land': this.noiseHit(t, 0.12, 0.2, 400, 'lowpass', d); this.tone(90, t, 0.1, 'sine', 0.3, d); break;
      case 'whoosh': this.noiseHit(t, 0.14, 0.12, 1200, 'bandpass', d, 3200); break;
      case 'punch': this.noiseHit(t, 0.1, 0.16, 1500, 'bandpass', d, 3000); break;
      case 'kick': this.noiseHit(t, 0.14, 0.18, 1000, 'bandpass', d, 2800); break;
      case 'heavy': this.noiseHit(t, 0.22, 0.25, 700, 'bandpass', d, 2400); this.tone(110, t, 0.2, 'sine', 0.2, d, 800, 60); break;
      case 'hit': this.noiseHit(t, 0.09, 0.4, r(900, 1400), 'lowpass', d); this.tone(r(150, 190), t, 0.1, 'square', 0.18, d, 900, 70); break;
      case 'hitHeavy': this.noiseHit(t, 0.2, 0.55, 700, 'lowpass', d); this.tone(80, t, 0.28, 'sawtooth', 0.35, d, 600, 38); break;
      case 'enemyHit': this.tone(r(200, 240), t, 0.1, 'square', 0.14, d, 1200, 100); break;
      case 'block': this.tone(900, t, 0.08, 'triangle', 0.25, d, 6000, 500); this.noiseHit(t, 0.06, 0.2, 3000, 'highpass', d); break;
      case 'perfect': this.tone(1320, t, 0.25, 'sine', 0.3, d, 8000); this.tone(1980, t + 0.04, 0.3, 'sine', 0.2, d, 8000); break;
      case 'dash': this.noiseHit(t, 0.2, 0.2, 600, 'bandpass', d, 4000); break;
      case 'dodge': this.noiseHit(t, 0.22, 0.14, 800, 'bandpass', d, 2200); break;
      case 'fire': this.noiseHit(t, 0.4, 0.3, 500, 'bandpass', d, 2500); this.tone(180, t, 0.3, 'sawtooth', 0.15, d, 900, 420); break;
      case 'zap': this.noiseHit(t, 0.25, 0.25, 4000, 'highpass', d); this.tone(1800, t, 0.2, 'sawtooth', 0.14, d, 6000, 200); break;
      case 'hurt': this.tone(r(300, 340), t, 0.2, 'sawtooth', 0.2, d, 1500, 120); this.noiseHit(t, 0.1, 0.25, 900, 'lowpass', d); break;
      case 'enemyDie': this.tone(240, t, 0.4, 'sawtooth', 0.2, d, 1200, 50); this.noiseHit(t, 0.2, 0.25, 600, 'lowpass', d); break;
      case 'death': this.tone(330, t, 0.9, 'sawtooth', 0.28, d, 1200, 40); break;
      case 'pickup': this.tone(784, t, 0.12, 'triangle', 0.3, d, 6000); this.tone(1175, t + 0.09, 0.2, 'triangle', 0.3, d, 6000); break;
      case 'levelUp': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.09, 0.3, 'triangle', 0.3, d, 6000)); break;
      case 'checkpoint': [392, 523, 659].forEach((f, i) => this.tone(f, t + i * 0.1, 0.5, 'sine', 0.25, d, 5000)); break;
      case 'quest': [440, 554, 659].forEach((f, i) => this.tone(f, t + i * 0.08, 0.3, 'square', 0.1, d, 3000)); break;
      case 'ui': this.tone(660, t, 0.06, 'square', 0.08, d, 3000); break;
      case 'uiBack': this.tone(440, t, 0.07, 'square', 0.08, d, 3000); break;
      case 'telegraph': this.tone(220, t, 0.35, 'sawtooth', 0.14, d, 1400, 880); break;
      case 'slam': this.noiseHit(t, 0.45, 0.6, 400, 'lowpass', d); this.tone(60, t, 0.5, 'sine', 0.55, d, 400, 30); break;
      case 'roar': this.tone(90, t, 1.0, 'sawtooth', 0.3, d, 700, 55); this.noiseHit(t, 0.9, 0.3, 500, 'lowpass', d); break;
      case 'gate': this.tone(70, t, 1.2, 'square', 0.2, d, 400, 45); this.noiseHit(t, 1.1, 0.25, 300, 'lowpass', d); break;
    }
  }

  dispose(): void {
    this.stopScheduler();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }
}

export const audio = new AudioManager();
