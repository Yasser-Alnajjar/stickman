import type Phaser from 'phaser';
import type { WeaponArt, WeaponCategory } from '@/game/weapons/types';
import { tint } from './accessories';

/** Everything a weapon painter needs for one frame (world space, already facing-aware). */
export interface WeaponCtx {
  g: Phaser.GameObjects.Graphics;
  /** Hand position. */
  x: number; y: number;
  /** Direction along the weapon (screen radians). */
  ang: number;
  F: 1 | -1;
  s: number;
  alpha: number;
  time: number;
  /** 0..1 emphasis while swinging. */
  swing: number;
}

export interface WeaponPainter {
  readonly category: WeaponCategory;
  /** Two-handed weapons get the rear hand pulled onto the shaft. */
  readonly twoHanded: boolean;
  /** Daggers: a second blade in the rear hand. */
  readonly dual: boolean;
  /** Distance (px at scale 1) from the front hand back along the shaft to the rear grip. */
  readonly grip: number;
  /** Length (px at scale 1) from the hand to the business end. */
  readonly reach: number;
  draw(c: WeaponCtx): void;
}

/** Transforms weapon-local coordinates (x along the weapon, y across it) into world space. */
function frame(c: WeaponCtx): (lx: number, ly: number) => { x: number; y: number } {
  const cos = Math.cos(c.ang), sin = Math.sin(c.ang);
  return (lx, ly) => {
    const a = lx * c.s, b = ly * c.F * c.s;
    return { x: c.x + a * cos - b * sin, y: c.y + a * sin + b * cos };
  };
}

function poly(c: WeaponCtx, pts: [number, number][], color: number, a = 1, P = frame(c)): void {
  c.g.fillStyle(color, a * c.alpha);
  c.g.fillPoints(pts.map(([lx, ly]) => P(lx, ly)), true);
}

function line(c: WeaponCtx, x0: number, y0: number, x1: number, y1: number, w: number, color: number, a = 1, P = frame(c)): void {
  const p0 = P(x0, y0), p1 = P(x1, y1);
  c.g.lineStyle(w * c.s, color, a * c.alpha);
  c.g.lineBetween(p0.x, p0.y, p1.x, p1.y);
}

function glowLine(c: WeaponCtx, art: WeaponArt, x0: number, x1: number, w: number, P = frame(c)): void {
  if (art.glow === undefined) return;
  const pulse = 0.55 + 0.25 * Math.sin(c.time * 6) + c.swing * 0.3;
  line(c, x0, 0, x1, 0, w, art.glow, 0.28 * pulse, P);
}

/* ------------------------------------------------------------------------------------------------ painters */

const sword = (art: WeaponArt): WeaponPainter => {
  const len = 46 * (art.length ?? 1);
  const v = art.variant ?? 0;
  return {
    category: 'sword', twoHanded: false, dual: false, grip: 0, reach: len + 6,
    draw(c) {
      const P = frame(c);
      glowLine(c, art, 6, len, 13, P);
      line(c, -9, 0, 6, 0, 4.5, art.accent, 1, P);          // grip
      c.g.fillStyle(art.accent, c.alpha); const pom = P(-10, 0); c.g.fillCircle(pom.x, pom.y, 3 * c.s);
      poly(c, [[6, -9], [9, -9], [9, 9], [6, 9]], tint(art.accent, 1.15), 1, P);  // cross-guard
      if (v === 1) poly(c, [[9, -3.4], [len * 0.55, -4.2], [len * 0.9, -2.2], [len, 3], [len * 0.88, 2.4], [len * 0.5, 3.4], [9, 3.4]], art.primary, 1, P); // curved sabre
      else if (v === 2) poly(c, [[9, -5], [len * 0.7, -5], [len, 0], [len * 0.7, 5], [9, 5]], art.primary, 1, P);                               // broadsword
      else poly(c, [[9, -3.4], [len * 0.92, -3], [len, 0], [len * 0.92, 3], [9, 3.4]], art.primary, 1, P);                                      // arming sword
      line(c, 11, 0, len * 0.9, 0, 1.4, 0xffffff, 0.55, P);   // fuller highlight
    },
  };
};

const daggers = (art: WeaponArt): WeaponPainter => {
  const len = 26 * (art.length ?? 1);
  const v = art.variant ?? 0;
  const blade = (c: WeaponCtx): void => {
    const P = frame(c);
    glowLine(c, art, 3, len, 8, P);
    line(c, -5, 0, 3, 0, 3.6, art.accent, 1, P);
    poly(c, [[3, -5], [5, -5], [5, 5], [3, 5]], tint(art.accent, 1.2), 1, P);
    if (v === 2) poly(c, [[5, -2.6], [len * 0.6, -4], [len, 3], [len * 0.55, 2]], art.primary, 1, P);   // curved fang
    else poly(c, [[5, -3], [len * 0.9, -2.6], [len, 0], [len * 0.9, 2.6], [5, 3]], art.primary, 1, P);
  };
  return { category: 'daggers', twoHanded: false, dual: true, grip: 0, reach: len + 4, draw: blade };
};

const axe = (art: WeaponArt): WeaponPainter => {
  const v = art.variant ?? 0;
  const L = 48 * (art.length ?? 1);
  return {
    category: 'axe', twoHanded: true, dual: false, grip: 14, reach: L + 4,
    draw(c) {
      const P = frame(c);
      glowLine(c, art, L - 16, L + 4, 18, P);
      line(c, -18, 0, L, 0, 4.4, art.accent, 1, P);            // haft
      line(c, -18, 0, -10, 0, 5.2, tint(art.accent, 0.7), 1, P);
      const hx = L - 18;
      if (v === 2) {                                             // double-bitted
        poly(c, [[hx, -3], [hx - 4, -22], [hx + 14, -26], [hx + 20, -10], [hx + 14, 0]], art.primary, 1, P);
        poly(c, [[hx, 3], [hx - 4, 22], [hx + 14, 26], [hx + 20, 10], [hx + 14, 0]], art.primary, 1, P);
      } else if (v === 1) {                                      // bearded war axe
        poly(c, [[hx, -3], [hx - 8, -20], [hx + 12, -26], [hx + 22, -12], [hx + 16, 0]], art.primary, 1, P);
        poly(c, [[hx, 3], [hx + 10, 9], [hx + 14, 3]], tint(art.primary, 0.8), 1, P);
      } else {                                                   // single-bit hatchet
        poly(c, [[hx, -3], [hx - 3, -19], [hx + 12, -23], [hx + 18, -9], [hx + 12, 0]], art.primary, 1, P);
        poly(c, [[hx, 3], [hx + 8, 6], [hx + 12, 3]], tint(art.primary, 0.75), 1, P);
      }
      line(c, hx + 14, -20, hx + 19, -9, 1.6, 0xffffff, 0.6, P);   // edge highlight
    },
  };
};

const spear = (art: WeaponArt): WeaponPainter => {
  const v = art.variant ?? 0;
  const L = 74 * (art.length ?? 1);
  return {
    category: 'spear', twoHanded: true, dual: false, grip: 18, reach: L,
    draw(c) {
      const P = frame(c);
      glowLine(c, art, L - 24, L, 12, P);
      line(c, -26, 0, L - 18, 0, 3.6, art.primary, 1, P);       // shaft
      line(c, -26, 0, -20, 0, 4.4, art.accent, 1, P);
      const b = L - 20;
      if (v === 2) {                                              // glaive blade
        poly(c, [[b, -2.4], [b + 4, -14], [b + 20, -9], [b + 26, 0], [b + 4, 3]], tint(art.accent, 1.2), 1, P);
      } else if (v === 1) {                                       // leaf
        poly(c, [[b, 0], [b + 8, -7], [b + 22, 0], [b + 8, 7]], tint(art.accent, 1.2), 1, P);
      } else {                                                    // plain head
        poly(c, [[b, -3.6], [b + 20, 0], [b, 3.6]], tint(art.accent, 1.2), 1, P);
      }
      poly(c, [[b - 6, -3], [b - 2, -7], [b - 2, 7], [b - 6, 3]], art.accent, 0.9, P);   // binding / tassel
    },
  };
};

const staff = (art: WeaponArt): WeaponPainter => {
  const v = art.variant ?? 0;
  const L = 62 * (art.length ?? 1);
  const glow = art.glow ?? 0xb98cff;
  return {
    category: 'staff', twoHanded: true, dual: false, grip: 20, reach: L + 8,
    draw(c) {
      const P = frame(c);
      line(c, -28, 0, L, 0, 4, art.primary, 1, P);
      line(c, -28, 0, -22, 0, 5, art.accent, 1, P);
      const pulse = 0.6 + 0.4 * Math.sin(c.time * 5) + c.swing * 0.5;
      const head = P(L + 4, 0);
      if (v === 2) {                                              // crystal
        poly(c, [[L - 2, 0], [L + 6, -7], [L + 16, 0], [L + 6, 7]], glow, 0.95, P);
        poly(c, [[L + 2, 0], [L + 6, -3], [L + 11, 0], [L + 6, 3]], 0xffffff, 0.8, P);
      } else if (v === 1) {                                       // forked cradle around an orb
        line(c, L - 6, -9, L + 6, -3, 3, art.accent, 1, P);
        line(c, L - 6, 9, L + 6, 3, 3, art.accent, 1, P);
        c.g.fillStyle(glow, 0.95 * c.alpha); c.g.fillCircle(head.x, head.y, 6 * c.s);
      } else {                                                    // orb on a ring
        line(c, L - 4, -8, L + 4, -8, 2.6, art.accent, 1, P);
        line(c, L - 4, 8, L + 4, 8, 2.6, art.accent, 1, P);
        c.g.fillStyle(glow, 0.95 * c.alpha); c.g.fillCircle(head.x, head.y, 5.5 * c.s);
      }
      c.g.fillStyle(glow, 0.22 * pulse * c.alpha); c.g.fillCircle(head.x, head.y, 15 * c.s * pulse);
    },
  };
};

const hammer = (art: WeaponArt): WeaponPainter => {
  const v = art.variant ?? 0;
  const L = 50 * (art.length ?? 1);
  return {
    category: 'hammer', twoHanded: true, dual: false, grip: 14, reach: L + 6,
    draw(c) {
      const P = frame(c);
      glowLine(c, art, L - 10, L + 10, 24, P);
      line(c, -18, 0, L, 0, 5, art.accent, 1, P);
      line(c, -18, 0, -9, 0, 5.8, tint(art.accent, 0.7), 1, P);
      const hx = L - 8;
      poly(c, [[hx, -16], [hx + 22, -16], [hx + 22, 16], [hx, 16]], art.primary, 1, P);     // head
      poly(c, [[hx, -16], [hx + 4, -16], [hx + 4, 16], [hx, 16]], tint(art.primary, 0.7), 1, P);
      poly(c, [[hx + 18, -16], [hx + 22, -16], [hx + 22, 16], [hx + 18, 16]], tint(art.primary, 1.25), 1, P);
      if (v >= 1) { poly(c, [[hx + 22, -9], [hx + 32, 0], [hx + 22, 9]], tint(art.primary, 0.9), 1, P); }  // spike face
      if (v === 2) { poly(c, [[hx - 8, -9], [hx, -3], [hx, 3], [hx - 8, 9]], tint(art.primary, 0.9), 1, P); }
      line(c, hx + 2, -16, hx + 2, 16, 2.6, art.accent, 1, P);                                // binding
    },
  };
};

const FAMILIES: Record<Exclude<WeaponCategory, 'fists'>, (a: WeaponArt) => WeaponPainter> = { sword, daggers, axe, spear, staff, hammer };

const cache = new Map<string, WeaponPainter>();
/** One painter per weapon id (stateless, so sharing is safe). Fists have no painter. */
export function painterFor(id: string, category: WeaponCategory, art: WeaponArt): WeaponPainter | null {
  if (category === 'fists') return null;
  let p = cache.get(id);
  if (!p) { p = FAMILIES[category](art); cache.set(id, p); }
  return p;
}
