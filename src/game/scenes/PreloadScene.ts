import Phaser from 'phaser';
import { generateFxTextures } from '@/game/managers/Fx';
import { bus } from '@/game/events/bus';

function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  draw(tex.getContext());
  tex.refresh();
}

const rnd = (seed: number): (() => number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

function skyline(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, minH: number, maxH: number, color: string, windows: string | null, arch: boolean): void {
  const r = rnd(seed);
  ctx.fillStyle = color;
  for (let x = 0; x < w; ) {
    const bw = 60 + r() * 110, bh = minH + r() * (maxH - minH);
    const draw = (ox: number): void => {
      if (arch) {
        ctx.fillRect(ox, h - bh, bw * 0.45, bh);
        ctx.beginPath(); ctx.arc(ox + bw * 0.6, h - bh + 40, bw * 0.55, Math.PI, 0); ctx.lineTo(ox + bw * 1.15, h); ctx.lineTo(ox + bw * 0.05, h); ctx.fill();
      } else {
        ctx.fillRect(ox, h - bh, bw, bh);
        if (r() < 0.3) ctx.fillRect(ox + bw * 0.4, h - bh - 24, 4, 24);
      }
      if (windows) {
        ctx.fillStyle = windows;
        for (let wy = h - bh + 14; wy < h - 20; wy += 22) for (let wx = ox + 8; wx < ox + bw - 10; wx += 16) if (r() < 0.22) ctx.fillRect(wx, wy, 6, 9);
        ctx.fillStyle = color;
      }
    };
    draw(x);
    if (x + bw > w) draw(x - w); // wrap so the tile is seamless
    x += bw + r() * 12;
  }
}

/** Generates every texture procedurally (no external assets), reporting progress to the loading screen. */
export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  create(): void {
    const steps: (() => void)[] = [
      () => generateFxTextures(this),
      () => canvasTex(this, 'sky_city', 16, 720, (c) => {
        const g = c.createLinearGradient(0, 0, 0, 720);
        g.addColorStop(0, '#070816'); g.addColorStop(0.55, '#1b1740'); g.addColorStop(0.85, '#4a2a62'); g.addColorStop(1, '#8a3f6a');
        c.fillStyle = g; c.fillRect(0, 0, 16, 720);
      }),
      () => canvasTex(this, 'sky_arena', 16, 720, (c) => {
        const g = c.createLinearGradient(0, 0, 0, 720);
        g.addColorStop(0, '#0a0508'); g.addColorStop(0.6, '#2a0f1c'); g.addColorStop(1, '#6a1f1f');
        c.fillStyle = g; c.fillRect(0, 0, 16, 720);
      }),
      () => canvasTex(this, 'far_city', 1024, 420, (c) => skyline(c, 1024, 420, 11, 140, 360, '#14122e', null, false)),
      () => canvasTex(this, 'mid_city', 1024, 360, (c) => skyline(c, 1024, 360, 29, 120, 300, '#0e1030', 'rgba(255,214,120,0.55)', false)),
      () => canvasTex(this, 'far_arena', 1024, 420, (c) => skyline(c, 1024, 420, 5, 160, 360, '#220c18', null, true)),
      () => canvasTex(this, 'mid_arena', 1024, 360, (c) => skyline(c, 1024, 360, 17, 120, 280, '#180810', 'rgba(255,120,60,0.45)', true)),
    ];
    let i = 0;
    const next = (): void => {
      if (i >= steps.length) {
        this.scene.launch('Backdrop');
        this.scene.start('MainMenu');
        bus.emit('loading', 1);
        return;
      }
      try { steps[i++](); } catch (e) { bus.emit('error', `Failed to build graphics: ${String(e)}`); throw e; }
      bus.emit('loading', i / steps.length);
      this.time.delayedCall(30, next);
    };
    next();
  }
}
