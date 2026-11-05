import type Phaser from 'phaser';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, hash, mulberry32, vgrad, wrapX } from '../../kit';

type Ctx = CanvasRenderingContext2D;
type G = Phaser.GameObjects.Graphics;

export const FROST = {
  snow: 0xe8f3fb, ice: 0x9fd4ef, iceDark: 0x4d86ad, steel: 0x56687a, steelDark: 0x2c3947, hazard: 0xf2b630, glow: 0x8fe8ff, ink: 0x0b1620,
} as const;

/* ------------------------------------------------------------------ backdrop */

function farMountains(c: Ctx, w: number, h: number): void {
  const r = mulberry32(55);
  for (let layer = 0; layer < 3; layer++) {
    const top = 120 + layer * 70;
    c.fillStyle = ['#7fa6c4', '#5f86a6', '#43667f'][layer];
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 48) c.lineTo(x, h - top - Math.abs(Math.sin(x * 0.0035 + layer * 1.7)) * (230 - layer * 40) - r() * 36);
    c.lineTo(w, h); c.closePath(); c.fill();
    c.fillStyle = 'rgba(245,252,255,0.85)'; // snow caps
    for (let x = 0; x < w; x += 48) { const y = h - top - Math.abs(Math.sin(x * 0.0035 + layer * 1.7)) * (230 - layer * 40); c.fillRect(x, y - 2, 48, 22); }
  }
  vgrad(c, 0, h - 130, w, 130, [[0, 'rgba(210,235,250,0)'], [1, 'rgba(210,235,250,0.55)']]);
}

function midStation(c: Ctx, w: number, h: number): void {
  const r = mulberry32(12);
  for (let x = 40; x < w; x += 250 + r() * 260) {
    const k = r();
    wrapX(w, x, 300, (ox) => {
      c.fillStyle = '#1b2a38';
      if (k < 0.4) { // research dome
        c.beginPath(); c.arc(ox + 90, h, 90 + r() * 30, Math.PI, 0); c.fill();
        c.fillStyle = 'rgba(143,232,255,0.65)'; for (let i = 0; i < 4; i++) c.fillRect(ox + 40 + i * 28, h - 70, 14, 20);
      } else if (k < 0.7) { // lab block with snow roof
        const bh = 120 + r() * 100; c.fillRect(ox, h - bh, 170, bh);
        c.fillStyle = '#e8f3fb'; c.fillRect(ox - 6, h - bh - 10, 182, 14);
        c.fillStyle = 'rgba(143,232,255,0.6)'; for (let i = 0; i < 4; i++) for (let j = 0; j < Math.floor(bh / 44); j++) c.fillRect(ox + 14 + i * 38, h - bh + 14 + j * 40, 20, 24);
      } else { // radio mast
        c.fillRect(ox + 40, h - 330, 8, 330); c.fillRect(ox + 10, h - 250, 70, 6); c.fillRect(ox + 20, h - 190, 50, 6);
        c.fillStyle = '#ff5a5a'; c.fillRect(ox + 38, h - 340, 12, 10);
      }
    });
  }
  vgrad(c, 0, h - 50, w, 50, [[0, 'rgba(230,243,251,0)'], [1, 'rgba(230,243,251,0.6)']]);
}

function nearCrags(c: Ctx, w: number, h: number): void {
  const r = mulberry32(31);
  c.fillStyle = '#071019';
  for (let x = 50; x < w; x += 420 + r() * 340) {
    wrapX(w, x - 40, 200, (ox) => {
      if (r() < 0.5) { // pine
        const ph = 260 + r() * 240;
        for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(ox, h - ph + i * ph * 0.17); c.lineTo(ox - 50 + i * 4, h - ph * 0.55 + i * ph * 0.1); c.lineTo(ox + 50 - i * 4, h - ph * 0.55 + i * ph * 0.1); c.fill(); }
        c.fillRect(ox - 6, h - ph * 0.25, 12, ph * 0.25);
      } else { // ice crag
        c.beginPath(); c.moveTo(ox - 40, h); c.lineTo(ox - 8, h - 280 - r() * 160); c.lineTo(ox + 20, h - 180); c.lineTo(ox + 46, h - 250 - r() * 90); c.lineTo(ox + 80, h); c.fill();
      }
    });
  }
}

const art: BackdropArt = {
  sky: [[0, '#0f3b66'], [0.4, '#4c8bbb'], [0.8, '#cfe6f2'], [1, '#f2f8fb']],
  far: { w: 2048, h: 520, draw: farMountains },
  mid: { w: 2048, h: 420, draw: midStation },
  near: { w: 2048, h: 640, draw: nearCrags },
};

function backdropFx(g: G, f: BackdropFrame): void {
  const { w, h, zoom, t } = f;
  g.clear();
  // aurora ribbons
  for (let k = 0; k < 3; k++) {
    g.fillStyle([0x5dffb5, 0x7be6ff, 0xb28bff][k], 0.07);
    const y0 = h * (0.12 + k * 0.07);
    for (let x = 0; x < w; x += 24) { const y = y0 + Math.sin(x * 0.006 + t * (0.4 + k * 0.15) + k) * 26 * zoom; g.fillRect(x, y, 24, (60 + 30 * Math.sin(x * 0.01 + t + k)) * zoom); }
  }
  // distant snow squalls
  for (let i = 0; i < 3; i++) {
    const sx = ((hash(i + 3) * w * 1.3 + t * (16 + i * 7) * zoom - f.midX * 0.05 * zoom) % (w * 1.3)) - w * 0.15;
    g.fillStyle(0xffffff, 0.12).fillEllipse(sx, f.sy(0.1, 0.88, 160 + i * 36), 520 * zoom, 90 * zoom);
  }
}

/* ------------------------------------------------------------------ helpers */

function snowCap(g: G, x: number, y: number, w: number, seed: number): void {
  g.fillStyle(FROST.snow, 1).fillRect(x - 2, y - 7, w + 4, 9);
  for (let xx = x; xx < x + w; xx += 28) g.fillCircle(xx + 10 + hash(seed + xx) * 8, y - 5, 8 + hash(seed + xx + 2) * 6);
}

function icicles(g: G, x: number, y: number, w: number, seed: number, len = 26): void {
  g.fillStyle(FROST.ice, 0.95);
  for (let xx = x + 6; xx < x + w; xx += 20) { const l = len * (0.5 + hash(seed + xx)); g.fillTriangle(xx - 5, y, xx + 5, y, xx, y + l); }
}

function panels(g: G, x: number, y: number, w: number, h: number, base: number): void {
  g.fillStyle(base, 1).fillRect(x, y, w, h);
  g.lineStyle(2, FROST.ink, 0.5);
  for (let xx = x + 90; xx < x + w; xx += 90) g.lineBetween(xx, y, xx, y + h);
  for (let yy = y + 60; yy < y + h; yy += 60) g.lineBetween(x, yy, x + w, yy);
  g.fillStyle(FROST.ink, 0.5);
  for (let xx = x + 8; xx < x + w; xx += 90) for (let yy = y + 8; yy < y + h; yy += 60) g.fillCircle(xx, yy, 2);
}

/* ------------------------------------------------------------------ theme */

export const frostTheme: WorldTheme = {
  id: 'frost',
  accent: FROST.glow,
  backdrop: art,
  backdropFx,

  drawSolid(g, s) {
    switch (s.kind) {
      case 'ground': {
        g.fillStyle(0xb8d4e6, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0x7fa8c4, 1).fillRect(s.x, s.y + 30, s.w, s.h - 30);
        g.lineStyle(2, 0xe8f3fb, 0.55);
        for (let xx = s.x + 40; xx < s.x + s.w; xx += 110) g.lineBetween(xx, s.y + 14, xx + 30 + hash(xx) * 40, s.y + 90);
        snowCap(g, s.x, s.y, s.w, s.x);
        break;
      }
      case 'roof': { // station roof, hazard-striped, snow piled on top
        panels(g, s.x, s.y, s.w, s.h, FROST.steel);
        g.fillStyle(FROST.hazard, 1);
        for (let xx = s.x; xx < s.x + s.w; xx += 40) g.fillTriangle(xx, s.y + s.h, xx + 20, s.y + s.h, xx + 10, s.y + s.h - 8);
        snowCap(g, s.x, s.y, s.w, s.x + 3);
        icicles(g, s.x, s.y + s.h, s.w, s.x);
        break;
      }
      case 'crate': { // ice block / supply crate
        g.fillStyle(0x6fb0d4, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0xcdeaf7, 0.5).fillRect(s.x + 6, s.y + 6, s.w * 0.35, s.h - 12);
        g.lineStyle(2, 0xe8f3fb, 0.7).strokeRect(s.x, s.y, s.w, s.h);
        snowCap(g, s.x, s.y, s.w, s.x);
        break;
      }
      case 'gate': { panels(g, s.x, s.y, s.w, s.h, FROST.steelDark); g.fillStyle(FROST.hazard, 1).fillRect(s.x, s.y + s.h * 0.4, s.w, 14); break; }
      default: { panels(g, s.x, s.y, s.w, s.h, FROST.steelDark); snowCap(g, s.x, s.y, s.w, s.x); }
    }
  },

  drawLedge(g, o) { // ice shelf: frozen and glittering, with icicles underneath
    g.fillStyle(0xa9dcf2, 1).fillRect(o.x, o.y, o.w, 12);
    g.fillStyle(0xffffff, 0.7).fillRect(o.x, o.y, o.w, 3);
    icicles(g, o.x, o.y + 12, o.w, o.x, 22);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'dome': {
        g.fillStyle(0x3a4d5f, 1).fillEllipse(d.x + d.w / 2, d.y + d.h, d.w, d.h * 2);
        g.fillStyle(0x8fe8ff, 0.4).fillEllipse(d.x + d.w / 2, d.y + d.h, d.w * 0.82, d.h * 1.64);
        g.lineStyle(2, 0xe8f3fb, 0.6);
        for (let i = 1; i < 5; i++) g.lineBetween(d.x + (d.w * i) / 5, d.y + d.h, d.x + d.w / 2 + (i - 2.5) * d.w * 0.05, d.y);
        snowCap(g, d.x + d.w * 0.2, d.y + 20, d.w * 0.6, d.seed);
        break;
      }
      case 'lab': {
        panels(g, d.x, d.y, d.w, d.h, 0x44586b);
        snowCap(g, d.x, d.y, d.w, d.seed);
        g.fillStyle(0xbfeaff, 0.85);
        for (let xx = d.x + 18; xx < d.x + d.w - 30; xx += 54) for (let yy = d.y + 24; yy < d.y + d.h - 60; yy += 56) g.fillRect(xx, yy, 28, 32);
        break;
      }
      case 'antenna': {
        g.fillStyle(FROST.steel, 1).fillRect(d.x - 5, d.y - d.h, 10, d.h).fillRect(d.x - 36, d.y - d.h * 0.7, 72, 6).fillRect(d.x - 24, d.y - d.h * 0.45, 48, 6);
        g.fillStyle(0xff5a5a, 1).fillRect(d.x - 7, d.y - d.h - 10, 14, 12);
        break;
      }
      case 'radar': g.fillStyle(FROST.steel, 1).fillRect(d.x - 6, d.y - d.h, 12, d.h).fillRect(d.x - 28, d.y - 12, 56, 12); break;
      case 'pine': {
        for (let i = 0; i < 5; i++) { g.fillStyle(i % 2 ? 0x1f4638 : 0x255142, 1).fillTriangle(d.x - d.w / 2 + i * 6, d.y - i * d.h * 0.17, d.x + d.w / 2 - i * 6, d.y - i * d.h * 0.17, d.x, d.y - d.h * 0.45 - i * d.h * 0.17); g.fillStyle(0xf2f8fb, 0.9).fillTriangle(d.x - d.w * 0.28 + i * 5, d.y - d.h * 0.2 - i * d.h * 0.17, d.x + d.w * 0.28 - i * 5, d.y - d.h * 0.2 - i * d.h * 0.17, d.x, d.y - d.h * 0.45 - i * d.h * 0.17); }
        g.fillStyle(0x3a2a1c, 1).fillRect(d.x - 7, d.y, 14, 30);
        break;
      }
      case 'drift': g.fillStyle(0xeaf5fb, 1).fillEllipse(d.x + d.w / 2, d.y, d.w, d.h * 2).fillStyle(0xcbe3f1, 1).fillEllipse(d.x + d.w * 0.65, d.y, d.w * 0.5, d.h * 1.2); break;
      case 'spikes': { // ice formations
        for (let i = 0; i < d.w / 24; i++) { const h = d.h * (0.4 + 0.6 * hash(d.seed + i)); g.fillStyle(i % 2 ? 0x9fd4ef : 0xcdeaf7, 0.95).fillTriangle(d.x + i * 24, d.y, d.x + i * 24 + 26, d.y, d.x + i * 24 + 12, d.y - h); }
        break;
      }
      case 'heater': g.fillStyle(0x3b4756, 1).fillRect(d.x - 18, d.y - d.h, 36, d.h).fillStyle(0x131b24, 1).fillRect(d.x - 12, d.y - d.h + 8, 24, d.h - 16); break;
      case 'supplies': {
        g.fillStyle(0x7a5a38, 1).fillRect(d.x, d.y, d.w, d.h).fillStyle(0x4a3422, 1).fillRect(d.x, d.y + d.h * 0.45, d.w, 5).fillStyle(FROST.hazard, 1).fillRect(d.x + 6, d.y + 6, d.w * 0.3, 10);
        snowCap(g, d.x, d.y, d.w, d.seed);
        break;
      }
      case 'hangice': icicles(g, d.x, d.y, d.w, d.seed, d.h); break;
      case 'sign': {
        g.fillStyle(FROST.steel, 1).fillRect(d.x + 8, d.y + d.h, 6, 60).fillRect(d.x + d.w - 14, d.y + d.h, 6, 60);
        g.fillStyle(0x15202b, 1).fillRect(d.x, d.y, d.w, d.h).lineStyle(2, FROST.hazard, 1).strokeRect(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
        ctx.text(d, 0xf2d27a);
        break;
      }
      case 'door': { // airlock
        g.fillStyle(0x0d1822, 1).fillRect(d.x, d.y, d.w, d.h).fillStyle(FROST.hazard, 1);
        for (let yy = d.y; yy < d.y + d.h; yy += 28) g.fillRect(d.x - 10, yy, 10, 14).fillRect(d.x + d.w, yy, 10, 14);
        g.lineStyle(4, FROST.steel, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(FROST.glow, 0.18).fillRect(d.x, d.y, d.w, d.h);
        if (d.text) ctx.text({ ...d, y: d.y - 34, h: 24 }, 0xf2d27a);
        break;
      }
      default: break;
    }
  },

  animated: {
    radar: {
      layer: 'back', pad: 100,
      draw(g, d, t) { // rotating dish
        const a = t * 0.9 + d.seed, top = d.y - d.h;
        const dx = Math.cos(a) * 46;
        g.fillStyle(0xcfdbe6, 1).fillEllipse(d.x, top, Math.abs(dx) * 2 + 8, 22);
        g.fillStyle(0xff5a5a, 1).fillCircle(d.x + dx * 0.6, top - 12, 3);
        g.fillStyle(0x8fe8ff, 0.1).fillTriangle(d.x, top, d.x + Math.sign(dx) * 400, top - 160, d.x + Math.sign(dx) * 400, top + 40);
      },
    },
    heater: {
      layer: 'back', pad: 90,
      draw(g, d, t) { // warm glow: a refuge in the cold
        const k = 0.7 + 0.3 * Math.sin(t * 5 + d.seed);
        g.fillStyle(0xffa64a, 0.14 * k).fillCircle(d.x, d.y - d.h / 2, 90);
        g.fillStyle(0xff8a2a, 0.95).fillRect(d.x - 10, d.y - d.h + 10, 20, d.h - 20);
      },
    },
    antenna: {
      layer: 'back', pad: 50,
      draw(g, d, t) { if (Math.sin(t * 3 + d.seed) > 0.3) g.fillStyle(0xff5a5a, 0.35).fillCircle(d.x, d.y - d.h - 4, 20); },
    },
    spikes: {
      layer: 'back', pad: 20,
      draw(g, d, t) { for (let i = 0; i < d.w / 24; i++) if (Math.sin(t * 2 + i + d.seed) > 0.8) g.fillStyle(0xffffff, 0.9).fillCircle(d.x + i * 24 + 12, d.y - d.h * 0.6, 2.5); },
    },
    windband: {
      layer: 'front', pad: 20,
      draw(g, d, t) { // streaks showing a gale band the player is carried through
        g.fillStyle(0xffffff, 0.22);
        for (let i = 0; i < 18; i++) { const x = d.x + ((hash(d.seed + i) * d.w + t * 520 * Math.sign(d.h || 1)) % d.w + d.w) % d.w; g.fillRect(x, GROUND_Y - 30 - hash(i + d.seed * 3) * 220, 38, 2); }
      },
    },
  },

  ambient(scene): AmbientParticles {
    const g = scene.add.graphics().setDepth(67);
    return {
      update(_dt, view, t) { // blizzard
        g.clear();
        g.fillStyle(0xffffff, 0.85);
        for (let i = 0; i < 95; i++) {
          const sp = 90 + hash(i) * 120;
          const px = view.left + ((hash(i * 7) * view.width * 1.2 - t * (160 + sp * 0.8)) % (view.width * 1.2) + view.width * 1.2) % (view.width * 1.2);
          const py = view.top + ((hash(i + 40) * view.height + t * sp) % view.height);
          g.fillRect(px, py, 2 + hash(i + 9) * 2, 2);
        }
        g.fillStyle(0xe8f3fb, 0.05 + 0.03 * Math.sin(t * 0.8)).fillRect(view.left, view.top, view.width, view.height);
      },
    };
  },
};
