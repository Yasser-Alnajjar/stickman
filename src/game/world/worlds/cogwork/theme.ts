import type Phaser from 'phaser';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, hash, mulberry32, vgrad, wrapX } from '../../kit';

type Ctx = CanvasRenderingContext2D;
type G = Phaser.GameObjects.Graphics;

export const COG = {
  brass: 0xc8923a, brassDark: 0x8a5e22, copper: 0xb4623a, iron: 0x3c3a40, ironLight: 0x6a6870, steam: 0xe9e4d6, amber: 0xffb347, ember: 0xff6a2a, ink: 0x120a08,
} as const;

/** A gear outline: `teeth` rectangular teeth around radius `r`, turned by `rot`. */
export function gearPath(g: G, cx: number, cy: number, r: number, teeth: number, rot: number, col: number, a = 1, hole = 0.3): void {
  g.fillStyle(col, a).fillCircle(cx, cy, r);
  for (let i = 0; i < teeth; i++) {
    const ang = rot + (i * Math.PI * 2) / teeth, tw = (Math.PI * 2 * r) / teeth * 0.4;
    const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
    g.fillTriangle(x - Math.sin(ang) * tw, y + Math.cos(ang) * tw, x + Math.sin(ang) * tw, y - Math.cos(ang) * tw, cx + Math.cos(ang) * (r + r * 0.28), cy + Math.sin(ang) * (r + r * 0.28));
  }
  g.fillStyle(0x000000, 0.45).fillCircle(cx, cy, r * hole);
  g.lineStyle(2, 0x000000, 0.35).strokeCircle(cx, cy, r * 0.7);
}

/* ------------------------------------------------------------------ backdrop */

function drawGearCtx(c: Ctx, cx: number, cy: number, r: number, teeth: number, col: string): void {
  c.fillStyle = col; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
  for (let i = 0; i < teeth; i++) { const a = (i * Math.PI * 2) / teeth, tw = (Math.PI * 2 * r) / teeth * 0.4; c.beginPath(); c.moveTo(cx + Math.cos(a) * r - Math.sin(a) * tw, cy + Math.sin(a) * r + Math.cos(a) * tw); c.lineTo(cx + Math.cos(a) * r * 1.26, cy + Math.sin(a) * r * 1.26); c.lineTo(cx + Math.cos(a) * r + Math.sin(a) * tw, cy + Math.sin(a) * r - Math.cos(a) * tw); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(cx, cy, r * 0.3, 0, 7); c.fill();
}

function farGears(c: Ctx, w: number, h: number): void {
  const r = mulberry32(99);
  vgrad(c, 0, 0, w, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']]);
  for (let i = 0; i < 7; i++) {
    const rad = 90 + r() * 170, cx = r() * w, cy = h - 140 - r() * 280;
    wrapX(w, cx - rad * 1.4, rad * 2.8, (ox) => drawGearCtx(c, ox + rad * 1.4, cy, rad, 14 + Math.floor(rad / 14), `rgba(${60 + r() * 30},${34 + r() * 16},${18 + r() * 10},0.95)`));
  }
  c.strokeStyle = 'rgba(20,12,8,0.9)'; c.lineWidth = 4;
  for (let x = 40; x < w; x += 190 + r() * 120) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 90 + r() * 200); c.stroke(); c.beginPath(); c.arc(x, 100 + r() * 200, 8, 0, 7); c.stroke(); }
  vgrad(c, 0, h - 120, w, 120, [[0, 'rgba(255,150,60,0)'], [1, 'rgba(255,150,60,0.28)']]);
}

function midCity(c: Ctx, w: number, h: number): void {
  const r = mulberry32(17);
  for (let x = 10; x < w; x += 130 + r() * 120) {
    const bw = 100 + r() * 100, bh = 150 + r() * 220;
    wrapX(w, x, bw + 40, (ox) => {
      c.fillStyle = '#1a0f0a'; c.fillRect(ox, h - bh, bw, bh);
      c.fillRect(ox + 12, h - bh - 30, bw - 24, 32); c.fillRect(ox + bw * 0.6, h - bh - 100, 18, 80);
      c.fillStyle = 'rgba(255,179,71,0.7)'; for (let i = 0; i < 3; i++) for (let j = 0; j < Math.floor(bh / 46); j++) if (r() > 0.35) c.fillRect(ox + 14 + i * Math.floor(bw / 3.3), h - bh + 16 + j * 42, 12, 18);
      c.fillStyle = 'rgba(233,228,214,0.35)'; c.beginPath(); c.arc(ox + bw * 0.6 + 9, h - bh - 110, 14, 0, 7); c.arc(ox + bw * 0.6 + 24, h - bh - 140, 20, 0, 7); c.fill();
    });
  }
  vgrad(c, 0, h - 60, w, 60, [[0, 'rgba(80,40,10,0)'], [1, 'rgba(80,40,10,0.55)']]);
}

function nearPipes(c: Ctx, w: number, h: number): void {
  const r = mulberry32(2);
  c.fillStyle = '#080402'; c.strokeStyle = '#080402';
  for (let x = 50; x < w; x += 300 + r() * 280) {
    wrapX(w, x - 40, 140, (ox) => {
      const ph = 240 + r() * 320;
      c.fillRect(ox, h - ph, 22, ph); c.fillRect(ox - 10, h - ph - 10, 42, 14); c.fillRect(ox - 6, h - 40, 34, 40);
      c.lineWidth = 12; c.beginPath(); c.moveTo(ox + 11, h - ph * 0.5); c.lineTo(ox + 90, h - ph * 0.5); c.lineTo(ox + 90, h - ph * 0.5 - 60); c.stroke(); c.beginPath(); c.arc(ox + 90, h - ph * 0.5 - 70, 14, 0, 7); c.stroke();
    });
  }
}

const art: BackdropArt = {
  sky: [[0, '#090503'], [0.5, '#24130a'], [1, '#583214']],
  far: { w: 2048, h: 540, draw: farGears },
  mid: { w: 2048, h: 420, draw: midCity },
  near: { w: 2048, h: 620, draw: nearPipes },
};

function backdropFx(g: G, f: BackdropFrame): void {
  const { w, h, zoom, t } = f;
  g.clear();
  for (let i = 0; i < 3; i++) { // huge slow gears turning behind everything
    const gx = ((hash(i + 6) * w * 1.2 - f.midX * 0.04 * zoom) % w + w) % w, gy = h * (0.25 + 0.2 * hash(i + 1)), rad = (120 + 60 * hash(i + 9)) * zoom;
    gearPath(g, gx, gy, rad, 16, t * (i % 2 ? 0.2 : -0.16), COG.brassDark, 0.25, 0.25);
  }
  for (let i = 0; i < 5; i++) { // steam drifting up from the city
    const sx = ((hash(i + 30) * w + t * 5 * zoom) % w), u = (t * 0.1 + hash(i)) % 1;
    g.fillStyle(COG.steam, 0.1 * (1 - u)).fillCircle(sx, h * 0.78 - u * h * 0.5, (20 + u * 50) * zoom);
  }
}

/* ------------------------------------------------------------------ helpers */

function plate(g: G, x: number, y: number, w: number, h: number, base: number): void {
  g.fillStyle(base, 1).fillRect(x, y, w, h);
  g.lineStyle(2, COG.ink, 0.5);
  for (let xx = x + 110; xx < x + w; xx += 110) g.lineBetween(xx, y, xx, y + h);
  for (let yy = y + 60; yy < y + h; yy += 60) g.lineBetween(x, yy, x + w, yy);
  g.fillStyle(COG.brass, 0.85);
  for (let xx = x + 8; xx < x + w; xx += 110) for (let yy = y + 8; yy < y + h; yy += 60) g.fillCircle(xx, yy, 3);
  g.fillStyle(0xffffff, 0.06).fillRect(x, y, w, 6);
}

/* ------------------------------------------------------------------ theme */

export const cogTheme: WorldTheme = {
  id: 'cogwork',
  accent: COG.amber,
  backdrop: art,
  backdropFx,

  drawSolid(g, s) {
    switch (s.kind) {
      case 'ground': {
        plate(g, s.x, s.y, s.w, s.h, COG.iron);
        g.fillStyle(COG.brass, 1).fillRect(s.x, s.y, s.w, 7).fillStyle(COG.brassDark, 1).fillRect(s.x, s.y + 7, s.w, 4);
        for (let xx = s.x + 30; xx < s.x + s.w; xx += 180) g.fillStyle(COG.ink, 0.6).fillRect(xx, s.y + 22, 70, 6).fillStyle(COG.amber, 0.5).fillRect(xx + 4, s.y + 24, 62, 2);
        break;
      }
      case 'roof': {
        plate(g, s.x, s.y, s.w, s.h, COG.brassDark);
        g.fillStyle(COG.brass, 1).fillRect(s.x, s.y, s.w, 6);
        g.fillStyle(COG.copper, 1); for (let xx = s.x + 10; xx < s.x + s.w - 20; xx += 70) g.fillRect(xx, s.y + 12, 40, 6);
        break;
      }
      case 'crate': {
        plate(g, s.x, s.y, s.w, s.h, COG.ironLight);
        g.lineStyle(3, COG.ink, 0.7).strokeRect(s.x, s.y, s.w, s.h);
        g.fillStyle(COG.brass, 1).fillRect(s.x, s.y, s.w, 5);
        break;
      }
      case 'gate': { plate(g, s.x, s.y, s.w, s.h, COG.iron); g.fillStyle(COG.ember, 0.9).fillRect(s.x, s.y + s.h * 0.45, s.w, 9); break; }
      default: plate(g, s.x, s.y, s.w, s.h, COG.iron);
    }
  },

  drawLedge(g, o) { // grated catwalk with gear-tooth underside
    g.fillStyle(COG.iron, 1).fillRect(o.x, o.y, o.w, 8);
    g.fillStyle(COG.brass, 1).fillRect(o.x, o.y, o.w, 3);
    g.lineStyle(2, COG.ink, 0.6); for (let xx = o.x + 8; xx < o.x + o.w; xx += 12) g.lineBetween(xx, o.y + 3, xx, o.y + 8);
    g.fillStyle(COG.brassDark, 1);
    for (let xx = o.x + 12; xx < o.x + o.w - 12; xx += 28) g.fillTriangle(xx, o.y + 8, xx + 14, o.y + 8, xx + 7, o.y + 22);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'building': {
        plate(g, d.x, d.y, d.w, d.h, 0x3a2a1e);
        g.fillStyle(COG.brass, 1).fillRect(d.x - 8, d.y - 12, d.w + 16, 14).fillRect(d.x + d.w * 0.7, d.y - 110, 22, 100).fillRect(d.x + d.w * 0.7 - 6, d.y - 118, 34, 10);
        for (let xx = d.x + 24; xx < d.x + d.w - 40; xx += 76) for (let yy = d.y + 28; yy < d.y + d.h - 70; yy += 80) { g.fillStyle(0x0a0604, 1).fillRect(xx, yy, 40, 48); g.fillStyle(COG.amber, 0.55).fillRect(xx + 4, yy + 4, 32, 40); g.lineStyle(2, COG.brass, 1).strokeRect(xx, yy, 40, 48); }
        break;
      }
      case 'boiler': { g.fillStyle(COG.copper, 1).fillRect(d.x, d.y, d.w, d.h).fillEllipse(d.x + d.w / 2, d.y, d.w, 36); g.fillStyle(COG.brass, 1); for (let yy = d.y + 20; yy < d.y + d.h; yy += 44) g.fillRect(d.x, yy, d.w, 8); g.fillStyle(COG.ironLight, 1).fillCircle(d.x + d.w / 2, d.y + d.h * 0.4, 18).fillStyle(COG.ink, 1).fillCircle(d.x + d.w / 2, d.y + d.h * 0.4, 12); break; }
      case 'pipe': { g.fillStyle(COG.brassDark, 1).fillRect(d.x, d.y, d.w, 14).fillStyle(COG.brass, 1).fillRect(d.x, d.y, d.w, 4); for (let xx = d.x + 40; xx < d.x + d.w; xx += 160) g.fillStyle(COG.iron, 1).fillRect(xx, d.y - 4, 16, 22); break; }
      case 'chimney': g.fillStyle(0x2f2018, 1).fillRect(d.x - 20, d.y - d.h, 40, d.h).fillStyle(COG.brass, 1).fillRect(d.x - 26, d.y - d.h - 8, 52, 12); break;
      case 'furnace': { g.fillStyle(COG.iron, 1).fillRect(d.x, d.y, d.w, d.h).fillStyle(0x080402, 1).fillRect(d.x + d.w * 0.2, d.y + d.h * 0.4, d.w * 0.6, d.h * 0.45).lineStyle(4, COG.brass, 1).strokeRect(d.x + d.w * 0.2, d.y + d.h * 0.4, d.w * 0.6, d.h * 0.45); break; }
      case 'clock': { g.fillStyle(COG.brassDark, 1).fillCircle(d.x + d.w / 2, d.y + d.w / 2, d.w / 2 + 8).fillStyle(0xf0e6c8, 1).fillCircle(d.x + d.w / 2, d.y + d.w / 2, d.w / 2); g.lineStyle(3, COG.ink, 1); for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.lineBetween(d.x + d.w / 2 + Math.cos(a) * d.w * 0.4, d.y + d.w / 2 + Math.sin(a) * d.w * 0.4, d.x + d.w / 2 + Math.cos(a) * d.w * 0.46, d.y + d.w / 2 + Math.sin(a) * d.w * 0.46); } break; }
      case 'lamp': g.fillStyle(COG.iron, 1).fillRect(d.x - 3, d.y - d.h, 6, d.h).fillRect(d.x - 12, d.y - d.h - 6, 24, 8); g.lineStyle(2, COG.brass, 1).strokeRect(d.x - 9, d.y - d.h - 28, 18, 24); break;
      case 'valve': g.fillStyle(COG.iron, 1).fillRect(d.x - 4, d.y - d.h, 8, d.h).lineStyle(4, COG.copper, 1).strokeCircle(d.x, d.y - d.h, 16).lineBetween(d.x - 16, d.y - d.h, d.x + 16, d.y - d.h).lineBetween(d.x, d.y - d.h - 16, d.x, d.y - d.h + 16); break;
      case 'chain': { g.lineStyle(4, 0x0a0604, 0.95); for (let y = d.y; y < d.y + d.h; y += 12) g.strokeEllipse(d.x, y + 6, 8, 12); g.fillStyle(0x0a0604, 0.95).fillTriangle(d.x - 9, d.y + d.h, d.x + 9, d.y + d.h, d.x, d.y + d.h + 22); break; }
      case 'sign': {
        g.fillStyle(COG.iron, 1).fillRect(d.x + 10, d.y + d.h, 6, 60).fillRect(d.x + d.w - 16, d.y + d.h, 6, 60);
        g.fillStyle(0x1a0f0a, 1).fillRect(d.x, d.y, d.w, d.h).lineStyle(3, COG.brass, 1).strokeRect(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
        ctx.text(d, 0xf0d28a);
        break;
      }
      case 'door': {
        g.fillStyle(0x0a0604, 1).fillRect(d.x, d.y, d.w, d.h).lineStyle(5, COG.brass, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(COG.amber, 0.15).fillRect(d.x, d.y, d.w, d.h);
        gearPath(g, d.x + d.w / 2, d.y - 24, 20, 10, 0, COG.brass, 1, 0.35);
        if (d.text) ctx.text({ ...d, y: d.y - 66, h: 24 }, 0xf0d28a);
        break;
      }
      default: break;
    }
  },

  animated: {
    gear: {
      layer: 'back', pad: 220,
      draw(g, d, t) { const dir = Math.floor(d.seed) % 2 ? 1 : -1; gearPath(g, d.x + d.w / 2, d.y + d.h / 2, d.w / 2, Math.max(10, Math.floor(d.w / 14)), t * 0.5 * dir, d.h > 0 ? COG.brassDark : COG.copper, 0.95, 0.28); },
    },
    piston: {
      layer: 'back', pad: 40,
      draw(g, d, t) { const k = 0.5 + 0.5 * Math.sin(t * 2.4 + d.seed); g.fillStyle(COG.iron, 1).fillRect(d.x - d.w / 2, d.y - d.h, d.w, d.h * 0.5); g.fillStyle(COG.ironLight, 1).fillRect(d.x - d.w / 4, d.y - d.h * 0.5, d.w / 2, d.h * 0.5 * k + 6); g.fillStyle(COG.brass, 1).fillRect(d.x - d.w / 2 - 4, d.y - d.h * 0.5 + d.h * 0.5 * k, d.w + 8, 10); },
    },
    steamvent: {
      layer: 'front', pad: 60,
      draw(g, d, t) { for (let i = 0; i < 5; i++) { const u = (t * 0.8 + i / 5 + hash(d.seed)) % 1; g.fillStyle(COG.steam, 0.55 * (1 - u)).fillCircle(d.x + Math.sin(t * 3 + i) * 6 * u, d.y - u * 120, 8 + u * 22); } },
    },
    furnace: {
      layer: 'back', pad: 100,
      draw(g, d, t) { const k = 0.7 + 0.3 * Math.sin(t * 8 + d.seed); g.fillStyle(COG.ember, 0.9 * k).fillRect(d.x + d.w * 0.22, d.y + d.h * 0.42, d.w * 0.56, d.h * 0.41); g.fillStyle(COG.amber, 0.14 * k).fillCircle(d.x + d.w / 2, d.y + d.h * 0.6, 120); },
    },
    clock: {
      layer: 'back', pad: 20,
      draw(g, d, t) { const cx = d.x + d.w / 2, cy = d.y + d.w / 2; g.lineStyle(4, COG.ink, 1).lineBetween(cx, cy, cx + Math.cos(t * 0.8 - 1.57) * d.w * 0.34, cy + Math.sin(t * 0.8 - 1.57) * d.w * 0.34); g.lineStyle(3, COG.ink, 1).lineBetween(cx, cy, cx + Math.cos(t * 0.067 - 1.57) * d.w * 0.24, cy + Math.sin(t * 0.067 - 1.57) * d.w * 0.24); },
    },
    lamp: {
      layer: 'back', pad: 80,
      draw(g, d, t) { const k = hash(Math.floor(t * 8) + d.seed) > 0.94 ? 0.4 : 1; g.fillStyle(COG.amber, 0.16 * k).fillCircle(d.x, d.y - d.h - 14, 70); g.fillStyle(COG.amber, 0.9 * k).fillRect(d.x - 6, d.y - d.h - 24, 12, 16); },
    },
    conveyor: {
      layer: 'back', pad: 20,
      draw(g, d, t) {
        const dir = d.h >= 0 ? 1 : -1;
        g.fillStyle(COG.amber, 0.8);
        for (let xx = 0; xx < d.w; xx += 54) { const x = d.x + ((xx + t * 100 * dir) % d.w + d.w) % d.w; g.fillTriangle(x, GROUND_Y - 6, x + 14 * dir, GROUND_Y - 1, x, GROUND_Y + 4); }
        g.fillStyle(COG.brass, 0.5).fillRect(d.x, GROUND_Y + 6, d.w, 3);
      },
    },
  },

  ambient(scene): AmbientParticles {
    const g = scene.add.graphics().setDepth(67);
    return {
      update(_dt, view, t) { // rising embers and a veil of steam
        g.clear();
        for (let i = 0; i < 30; i++) { const u = (t * (0.08 + hash(i) * 0.1) + hash(i + 3)) % 1; g.fillStyle(COG.ember, 0.7 * (1 - u)).fillRect(view.left + hash(i + 9) * view.width + Math.sin(t + i) * 20, view.bottom - u * view.height, 2, 2); }
        for (let i = 0; i < 4; i++) g.fillStyle(COG.steam, 0.05).fillEllipse(view.left + (((hash(i) * view.width * 1.4 + t * (8 + i * 3)) % (view.width * 1.4)) - view.width * 0.2), GROUND_Y - 40 - i * 60, 480, 60);
      },
    };
  },
};
