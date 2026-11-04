import type Phaser from 'phaser';
import type { DecorDef, OneWayDef, SolidDef } from '@/game/config/regions';

/** Shared building blocks for world packs. Nothing here is specific to one world. */

export const GROUND_Y = 960;

/** Deterministic PRNG so generated scenery is identical every run. */
export function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hash = (n: number): number => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

export function groundSlices(width: number, step = 800): SolidDef[] {
  const out: SolidDef[] = [];
  for (let x = 0; x < width; x += step) out.push({ id: `ground_${x}`, x, y: GROUND_Y, w: Math.min(step, width - x), h: 120, kind: 'ground' });
  return out;
}

/** Collects solids/ledges/decor for one region. `bodyKind` is the decor drawn under every roof. */
export class RegionBuilder {
  readonly solids: SolidDef[];
  readonly oneWays: OneWayDef[] = [];
  readonly decor: DecorDef[] = [];
  private did = 0;
  constructor(readonly width: number, private readonly bodyKind = 'building') { this.solids = groundSlices(width); }

  add(kind: string, x: number, y: number, w: number, h: number, text?: string, layer?: 'front'): DecorDef {
    const d: DecorDef = { id: `d${this.did++}`, kind, x, y, w, h, seed: this.did * 7919, text, layer };
    this.decor.push(d);
    return d;
  }
  roof(id: string, x: number, y: number, w: number, body = this.bodyKind): void {
    this.solids.push({ id, x, y, w, h: 28, kind: 'roof' });
    if (body) this.add(body, x, y + 28, w, GROUND_Y - y - 28);
  }
  crate(id: string, x: number, top: number, w = 100): void {
    this.solids.push({ id, x, y: top, w, h: GROUND_Y - top, kind: 'crate' });
  }
  ledge(x: number, y: number, w: number): void { this.oneWays.push({ id: `l${this.oneWays.length}`, x, y, w }); }
  /** Zig-zag climb ending on a top ledge. */
  tower(x: number, steps: number[], topW = 320): void {
    steps.forEach((y, i) => this.ledge(x + (i % 2) * 230, y, 190));
    this.ledge(x + 240, steps[steps.length - 1] - 100, topW);
  }
  door(x: number, label: string, kind = 'door'): void { this.add(kind, x, 820, 110, 140, label); }
  wallEnd(x: number): void { this.solids.push({ id: 'wallEnd', x, y: 0, w: 40, h: GROUND_Y, kind: 'wall' }); }
}

/* ------------------------------------------------------------------ drawing helpers */

type G = Phaser.GameObjects.Graphics;

/** Soft light: stacked translucent discs (cheap, no textures). */
export function glow(g: G, x: number, y: number, r: number, color: number, a = 0.3): void {
  g.fillStyle(color, a * 0.25).fillCircle(x, y, r);
  g.fillStyle(color, a * 0.35).fillCircle(x, y, r * 0.62);
  g.fillStyle(color, a * 0.6).fillCircle(x, y, r * 0.3);
}

export function rivets(g: G, x0: number, y: number, x1: number, step: number, color: number, a = 0.5, r = 2): void {
  g.fillStyle(color, a);
  for (let x = x0 + step / 2; x < x1; x += step) g.fillCircle(x, y, r);
}

/** Vertical colour ramp on a 2D canvas (backdrop painters). */
export function vgrad(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stops: [number, string][]): void {
  const gr = c.createLinearGradient(0, y, 0, y + h);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  c.fillStyle = gr;
  c.fillRect(x, y, w, h);
}

export function radial(c: CanvasRenderingContext2D, x: number, y: number, r: number, inner: string, outer = 'rgba(0,0,0,0)'): void {
  const gr = c.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  c.fillStyle = gr;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

export const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

/** Draws `fn` at `ox` and, when it would spill past the right edge, again shifted left so the tile wraps seamlessly. */
export function wrapX(w: number, ox: number, extent: number, fn: (x: number) => void): void {
  fn(ox);
  if (ox + extent > w) fn(ox - w);
}
