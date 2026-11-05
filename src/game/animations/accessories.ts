import type Phaser from 'phaser';

/** Joint indices of the rig (shared with StickmanRig). */
export const HIP = 0, SHO = 1, HEAD = 2, A_EL = 3, A_HA = 4, B_EL = 5, B_HA = 6, F_KN = 7, F_FO = 8, G_KN = 9, G_FO = 10;

export const tint = (c: number, k: number): number => {
  const r = Math.round(((c >> 16) & 255) * k), g = Math.round(((c >> 8) & 255) * k), b = Math.round((c & 255) * k);
  return (r << 16) | (g << 8) | b;
};

/** Everything an accessory painter may need for one frame. */
export interface AccessoryCtx {
  g: Phaser.GameObjects.Graphics;
  xs: Float32Array; ys: Float32Array;
  /** Facing (+1 right, -1 left). */
  F: 1 | -1;
  /** Rig scale. */
  s: number;
  /** Fighter alpha. */
  a: number;
  hr: number;
  col: number;
  accent: number;
  lineWidth: number;
  time: number;
  /** 0..1 how fast the fighter is running (trailing cloth streams back). */
  stream: number;
  /** sin(time * 9): cheap shared wobble. */
  w: number;
}

/** A painter for one accessory id. Built-ins use functions; world packs can use the declarative `parts` form. */
export interface AccessoryDef {
  eye?: number;
  /** Multiplies the torso line width. */
  torsoMul?: number;
  beforeTorso?(c: AccessoryCtx): void;
  back?(c: AccessoryCtx): void;
  front?(c: AccessoryCtx): void;
}

/* ------------------------------------------------------------------ declarative parts */

export type Anchor = 'head' | 'hip' | 'sho' | 'handA' | 'handB' | 'footF' | 'footG';
/** A palette reference (resolved per fighter) or a literal 0xRRGGBB colour. */
export type PartColor = number | 'col' | 'dark' | 'accent' | 'light';

interface PartBase { at: Anchor; c: PartColor; a?: number; layer?: 'back' | 'front'; sway?: number }
/** Coordinates are in rig units (multiplied by the fighter's scale, x mirrored by facing), relative to the anchor joint. */
export type Part =
  | (PartBase & { t: 'line'; p: [number, number, number, number]; w?: number })
  | (PartBase & { t: 'rect'; p: [number, number, number, number] })
  | (PartBase & { t: 'circle'; p: [number, number, number] })
  | (PartBase & { t: 'ellipse'; p: [number, number, number, number] })
  | (PartBase & { t: 'tri'; p: [number, number, number, number, number, number] })
  | (PartBase & { t: 'poly'; p: number[] });

/** The data-only form a World Pack puts in its manifest: no code, just shapes pinned to joints. */
export interface AccessorySpec { eye?: number; torsoMul?: number; parts: Part[] }

const ANCHOR: Record<Anchor, number> = { head: HEAD, hip: HIP, sho: SHO, handA: A_HA, handB: B_HA, footF: F_FO, footG: G_FO };

function resolve(c: AccessoryCtx, k: PartColor): number {
  if (typeof k === 'number') return k;
  return k === 'col' ? c.col : k === 'dark' ? tint(c.col, 0.45) : k === 'light' ? tint(c.col, 1.35) : c.accent;
}

export function drawParts(c: AccessoryCtx, parts: Part[], layer: 'back' | 'front'): void {
  const { g, F, s } = c;
  for (const part of parts) {
    if ((part.layer ?? 'front') !== layer) continue;
    const ax = c.xs[ANCHOR[part.at]], ay = c.ys[ANCHOR[part.at]];
    const col = resolve(c, part.c);
    const al = (part.a ?? 1) * c.a;
    const sway = part.sway ? Math.sin(c.time * 6 + ax * 0.01) * part.sway * s + (part.sway > 0 ? c.stream * part.sway * s * 0.6 : 0) : 0;
    const X = (v: number): number => ax + v * s * F, Y = (v: number): number => ay + v * s;
    switch (part.t) {
      case 'line': {
        const [x1, y1, x2, y2] = part.p;
        g.lineStyle((part.w ?? 3) * Math.max(0.7, s * 0.6), col, al).lineBetween(X(x1), Y(y1), X(x2) - sway * F, Y(y2) + Math.abs(sway) * 0.4);
        break;
      }
      case 'rect': {
        const [x, y, w, h] = part.p;
        g.fillStyle(col, al).fillRect(Math.min(X(x), X(x + w)), Y(y), Math.abs(w) * s, h * s);
        break;
      }
      case 'circle': g.fillStyle(col, al).fillCircle(X(part.p[0]), Y(part.p[1]), part.p[2] * s); break;
      case 'ellipse': g.fillStyle(col, al).fillEllipse(X(part.p[0]), Y(part.p[1]), part.p[2] * s, part.p[3] * s); break;
      case 'tri': {
        const p = part.p;
        g.fillStyle(col, al).fillTriangle(X(p[0]), Y(p[1]), X(p[2]), Y(p[3]), X(p[4]) - sway * F, Y(p[5]) + Math.abs(sway) * 0.4);
        break;
      }
      case 'poly': {
        g.fillStyle(col, al).beginPath();
        for (let i = 0; i < part.p.length; i += 2) {
          const last = i >= part.p.length - 2 && sway ? sway : 0;
          const px = X(part.p[i]) - last * F, py = Y(part.p[i + 1]);
          if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.closePath().fillPath();
        break;
      }
    }
  }
}

/** Turns a manifest's data-only accessory into a registrable painter. */
export function fromSpec(spec: AccessorySpec): AccessoryDef {
  return {
    eye: spec.eye, torsoMul: spec.torsoMul,
    back: (c) => drawParts(c, spec.parts, 'back'),
    front: (c) => drawParts(c, spec.parts, 'front'),
  };
}

/* ------------------------------------------------------------------ built-ins (the original rigs) */

const trailing = (c: AccessoryCtx, len: number): void => {
  const { g, xs, ys, F, s, a, accent, time, w, stream, lineWidth } = c;
  const nx = xs[SHO], ny = ys[SHO] - 2 * s;
  g.lineStyle(lineWidth * 0.8, accent, a);
  g.beginPath();
  g.moveTo(nx, ny);
  for (let i = 1; i <= 4; i++) {
    const t = i / 4;
    g.lineTo(nx - F * (len * t * (0.8 + stream * 0.9)), ny + Math.sin(time * 10 + i) * 3 * t + (1 - stream) * t * 12 * s + w * t);
  }
  g.strokePath();
};

const scarf: AccessoryDef = { back: (c) => trailing(c, 22 * c.s) };

export const ACCESSORIES: Record<string, AccessoryDef> = {
  default: {},
  scarf,
  blade: {
    back: scarf.back,
    front(c) {
      const { g, xs, ys, F, s, a, accent, hr } = c;
      g.lineStyle(3, 0xe6ecff, a);
      g.lineBetween(xs[A_HA], ys[A_HA], xs[A_HA] + F * 36 * s, ys[A_HA] - 26 * s);
      g.lineStyle(2, accent, a).lineBetween(xs[HEAD] - F * hr, ys[HEAD] - hr * 0.3, xs[HEAD] + F * hr, ys[HEAD] - hr * 0.3);
    },
  },
  hero: {
    back: (c) => trailing(c, 26 * c.s),
    front(c) {
      const { g, xs, ys, F, a, accent, hr } = c;
      g.lineStyle(2.6, accent, a);
      g.lineBetween(xs[HEAD] - F * hr, ys[HEAD] - hr * 0.25, xs[HEAD] + F * hr, ys[HEAD] - hr * 0.25);
    },
  },
  headband: {
    back(c) {
      const { g, xs, ys, F, a, accent, stream, w } = c;
      const hx = xs[HEAD], hy = ys[HEAD];
      g.lineStyle(2.4, accent, a);
      g.lineBetween(hx - F * 5, hy - 2, hx - F * (16 + stream * 8), hy + 3 + w * 2);
      g.lineBetween(hx - F * 5, hy - 2, hx - F * (13 + stream * 8), hy - 3 - w * 2);
    },
    front(c) {
      const { g, xs, ys, F, a, accent, hr } = c;
      g.lineStyle(2.6, accent, a);
      g.lineBetween(xs[HEAD] - F * hr, ys[HEAD] - hr * 0.35, xs[HEAD] + F * hr, ys[HEAD] - hr * 0.35);
    },
  },
  brute: {
    torsoMul: 1.25,
    beforeTorso(c) {
      const { g, xs, ys, col, a, lineWidth } = c;
      g.fillStyle(tint(col, 0.8), a);
      g.fillEllipse((xs[HIP] + xs[SHO]) / 2, (ys[HIP] + ys[SHO]) / 2, lineWidth * 2.6, Math.hypot(xs[SHO] - xs[HIP], ys[SHO] - ys[HIP]) + lineWidth * 0.8);
    },
    front(c) {
      const { g, xs, ys, s, a, col, accent, hr } = c;
      g.fillStyle(tint(col, 0.55), a);
      g.fillCircle(xs[SHO], ys[SHO] + 2 * s, 7 * s);
      g.fillStyle(accent, a);
      g.fillRect(xs[HIP] - 8 * s, ys[HIP] - 4 * s, 16 * s, 4 * s);
      g.fillStyle(tint(col, 0.55), a);
      g.fillRect(xs[HEAD] - hr, ys[HEAD] - hr, hr * 2, hr * 0.7);
    },
  },
  crown: {
    eye: 0xfff2a0,
    back(c) {
      const { g, xs, ys, F, s, a, accent, stream, w } = c;
      const sx0 = xs[SHO], sy0 = ys[SHO], hipx = xs[HIP], hipy = ys[HIP];
      g.fillStyle(0xd13a14, a);
      g.fillTriangle(sx0, sy0 - 2 * s, hipx - F * (34 + stream * 40) * s + w * 4, hipy + 30 * s, hipx, hipy + 4 * s);
      g.fillStyle(accent, a * 0.8);
      g.fillTriangle(sx0, sy0, hipx - F * (18 + stream * 26) * s + w * 3, hipy + 22 * s, hipx, hipy);
    },
    front(c) {
      const { g, xs, ys, F, s, a, accent, hr } = c;
      const hx = xs[HEAD], hy = ys[HEAD];
      void F;
      g.fillStyle(accent, a);
      for (let i = -1; i <= 1; i++) g.fillTriangle(hx + i * hr * 0.7 - hr * 0.3, hy - hr * 0.9, hx + i * hr * 0.7 + hr * 0.3, hy - hr * 0.9, hx + i * hr * 0.7, hy - hr * (i === 0 ? 2.5 : 2));
      g.fillStyle(0xff7a2a, a * 0.9).fillCircle(xs[A_HA], ys[A_HA], 7 * s);
    },
  },
  warden: {
    eye: 0xff2020,
    back(c) {
      const { g, xs, ys, F, s, a, stream, w } = c;
      const sx0 = xs[SHO], sy0 = ys[SHO], hipx = xs[HIP], hipy = ys[HIP];
      g.fillStyle(0x6b0f1a, a);
      g.beginPath();
      g.moveTo(sx0, sy0 - 2 * s);
      g.lineTo(sx0 - F * (14 + stream * 22) * s, sy0 + 8 * s);
      g.lineTo(hipx - F * (30 + stream * 36) * s + w * 3, hipy + 28 * s);
      g.lineTo(hipx - F * 8 * s, hipy + 34 * s);
      g.lineTo(hipx, hipy);
      g.closePath();
      g.fillPath();
    },
    front(c) {
      const { g, xs, ys, F, s, a, hr } = c;
      const hx = xs[HEAD], hy = ys[HEAD];
      g.lineStyle(4, 0xd9d9e8, a);
      g.lineBetween(hx - hr * 0.6, hy - hr * 0.6, hx - hr * 1.1 - F * 2, hy - hr * 1.9);
      g.lineBetween(hx + hr * 0.6, hy - hr * 0.6, hx + hr * 1.1 + F * 2, hy - hr * 1.9);
      g.fillStyle(0x2a2f45, a);
      g.fillRect(hx - hr * 1.05, hy - hr * 1.05, hr * 2.1, hr * 1.0);
      g.fillStyle(0xff2020, a);
      g.fillRect(hx + F * hr * 0.1 - 1, hy - hr * 0.5, hr * 0.9, 3);
      g.fillStyle(0x3a4060, a);
      g.fillCircle(xs[SHO] - F * 2, ys[SHO] + 3 * s, 10 * s);
      g.fillCircle(xs[SHO] + F * 2, ys[SHO] + 3 * s, 8 * s);
      g.lineStyle(4, 0xb0b4d0, a);
      g.lineBetween(xs[HIP] - 10 * s, ys[HIP] - 2 * s, xs[HIP] + 10 * s, ys[HIP] - 2 * s);
    },
  },
  hood: {
    front(c) {
      const { g, xs, ys, F, a, col, hr } = c;
      const hx = xs[HEAD], hy = ys[HEAD];
      g.fillStyle(tint(col, 0.55), a);
      g.fillTriangle(hx - hr * 1.15, hy + hr * 0.3, hx + hr * 1.15, hy + hr * 0.3, hx - F * hr * 0.35, hy - hr * 2.1);
    },
  },
  shield: {
    front(c) {
      const { g, xs, ys, F, s, a, col, accent, hr } = c;
      const top = ys[SHO] - 2 * s, bot = ys[HIP] + 6 * s, sx = xs[SHO] + F * 13 * s;
      g.fillStyle(tint(col, 0.7), a).fillRect(sx - 9 * s, top, 18 * s, bot - top);
      g.lineStyle(3, accent, a).strokeRect(sx - 9 * s, top, 18 * s, bot - top);
      g.fillStyle(accent, a).fillRect(sx - 2, top + 4, 4, bot - top - 8);
      g.fillStyle(tint(col, 0.6), a).fillRect(xs[HEAD] - hr * 1.05, ys[HEAD] - hr * 1.05, hr * 2.1, hr * 0.8);
    },
  },
  anchor: {
    eye: 0xffb454,
    front(c) {
      const { g, xs, ys, s, a, col, accent, hr } = c;
      const ax = xs[B_HA], ay = ys[B_HA], hx = xs[HEAD], hy = ys[HEAD];
      g.lineStyle(5, 0x8a97a8, a);
      g.lineBetween(ax, ay - 46 * s, ax, ay + 34 * s);
      g.lineBetween(ax - 16 * s, ay - 34 * s, ax + 16 * s, ay - 34 * s);
      g.lineBetween(ax - 18 * s, ay + 18 * s, ax, ay + 34 * s);
      g.lineBetween(ax + 18 * s, ay + 18 * s, ax, ay + 34 * s);
      g.fillStyle(accent, a).fillRect(hx - hr * 1.1, hy - hr * 1.5, hr * 2.2, hr * 0.7);
      g.fillStyle(tint(col, 0.55), a).fillCircle(xs[SHO], ys[SHO] + 3 * s, 9 * s);
    },
  },
};

/** Adds (or replaces nothing: ids must be new) a pack's accessory painters. */
export function registerAccessory(id: string, def: AccessoryDef): void {
  if (ACCESSORIES[id]) throw new Error(`Accessory "${id}" is already registered`);
  ACCESSORIES[id] = def;
}

export function accessoryOf(id: string): AccessoryDef {
  return ACCESSORIES[id] ?? ACCESSORIES.default;
}
