import type Phaser from 'phaser';
import type { BossId, RegionId } from '@/shared/types';
import type { DecorDef, OneWayDef, RegionDef, SolidDef, ZoneDef } from '@/game/config/regions';

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

/* ------------------------------------------------------------------ boss arenas */

export interface ArenaCfg {
  id: RegionId; name: string; theme: string; width: number; boss: BossId; bossX: number; lampId: string; lampName: string;
  /** One-way platforms as [x, y, width]. Every arena has its own layout. */
  platforms: [number, number, number][];
  /** Exit leading further on; omitted for the final arena. */
  next?: { to: RegionId; spawn: string; label: string };
  back: { to: RegionId; spawn: string };
  scale?: { hp: number; atk: number };
  /** Scenery: everything that makes this arena recognisable. Called with an empty builder (ground + east wall already placed). */
  decorate(b: RegionBuilder): void;
}

/** Shared skeleton of a boss arena (entry trigger, sealing barrier position, exits). All the looks come from `decorate` + the theme. */
export function arenaRegion(c: ArenaCfg): RegionDef {
  const W = c.width;
  const b = new RegionBuilder(W, '');
  b.solids.push({ id: 'wallE', x: W - 40, y: 0, w: 40, h: GROUND_Y, kind: 'wall' });
  c.platforms.forEach(([x, y, w], i) => b.oneWays.push({ id: `a${i + 1}`, x, y, w }));
  c.decorate(b);
  b.add('door', 40, 820, 110, 140, 'BACK');
  const zones: ZoneDef[] = [
    { id: 'boss_trigger', kind: 'boss', x: 620, y: 0, w: 60, h: 1080 },
    { id: 'to_back', kind: 'exit', x: 40, y: 820, w: 110, h: 140, to: c.back.to, spawn: c.back.spawn },
  ];
  if (c.next) {
    b.add('door', W - 160, 820, 110, 140, c.next.label);
    zones.push({ id: 'to_next', kind: 'exit', x: W - 160, y: 820, w: 110, h: 140, to: c.next.to, spawn: c.next.spawn, requiresBoss: c.boss });
  }
  return {
    id: c.id, name: c.name, width: W, height: 1080, groundY: GROUND_Y, theme: c.theme, music: 'none',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [], spawns: [],
    checkpoints: [{ id: c.lampId, name: c.lampName, x: 240 }],
    pickups: [], zones,
    spawnPoints: { entry: { x: 330, y: GROUND_Y }, from_east: { x: W - 340, y: GROUND_Y } },
    boss: { id: c.boss, x: c.bossX, barrierX: 590 },
    enemyScale: c.scale,
  };
}

/** Stateless weather: `n` slanted streaks wrapped inside the camera view (no per-particle state, one stroke call). */
export function rainLayer(scene: Phaser.Scene, o: { n: number; color: number; alpha: number; vx: number; speed: number; len: number; depth?: number; width?: number }): { update(view: Phaser.Geom.Rectangle, t: number): void } {
  const g = scene.add.graphics().setDepth(o.depth ?? 68);
  return {
    update(view, t) {
      g.clear();
      const W = view.width, H = view.height;
      g.lineStyle(o.width ?? 1.4, o.color, o.alpha).beginPath();
      for (let i = 0; i < o.n; i++) {
        const px = view.left + (((hash(i) * W + t * o.vx) % W) + W) % W;
        const py = view.top + (((hash(i + 99) * H + t * o.speed * (0.8 + hash(i + 7) * 0.4)) % H) + H) % H;
        g.moveTo(px, py).lineTo(px - o.vx * 0.02 * o.len / 20, py + o.len);
      }
      g.strokePath();
    },
  };
}
