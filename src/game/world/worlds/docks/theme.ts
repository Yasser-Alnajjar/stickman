import Phaser from 'phaser';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, hash, mulberry32, vgrad, wrapX } from '../../kit';

/**
 * RUST DOCKS: a working harbour at dusk. Timber pier over open water, shipping-container stacks, gantry cranes,
 * corrugated sheds and a moored freighter. Rust orange, weathered teal, oxblood and mustard against a smoky orange sky.
 */

export const DOCK = {
  rust: 0xa8532b, rustDark: 0x5a2c1a, teal: 0x2f6f73, red: 0x9c3b2f, mustard: 0xc49a2c, blue: 0x3a5f8f, green: 0x3f7a4a,
  steel: 0x2b333f, steel2: 0x3a4452, wood: 0x6b4a2b, woodDark: 0x3d2a17, sea: 0x1c4252, seaDeep: 0x10303c,
} as const;
export const CONTAINER_COLORS = [DOCK.rust, DOCK.teal, DOCK.red, DOCK.mustard, DOCK.blue, DOCK.green, 0x7a4a2a];

const surge = { since: -99 };
export function triggerSurge(now: number): void { surge.since = now; }

type Ctx = CanvasRenderingContext2D;

/* ------------------------------------------------------------------ backdrop art */

const shade = (col: number, k: number): string => {
  const r = Math.round(((col >> 16) & 255) * k), g = Math.round(((col >> 8) & 255) * k), b = Math.round((col & 255) * k);
  return `rgb(${r},${g},${b})`;
};

function canvasContainer(c: Ctx, x: number, y: number, w: number, h: number, col: number, k: number): void {
  c.fillStyle = shade(col, k); c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(0,0,0,0.22)';
  for (let cx = x + 4; cx < x + w - 3; cx += 5) c.fillRect(cx, y + 2, 1.5, h - 4);
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x, y + h - 2, w, 2);
}

function canvasCrane(c: Ctx, x: number, y: number, s: number, fill: string): void {
  c.fillStyle = fill;
  c.fillRect(x, y - 150 * s, 8 * s, 150 * s);
  c.fillRect(x + 110 * s, y - 150 * s, 8 * s, 150 * s);
  c.fillRect(x - 10 * s, y - 160 * s, 190 * s, 10 * s);
  c.fillRect(x + 118 * s, y - 175 * s, 10 * s, 20 * s);
  c.strokeStyle = fill; c.lineWidth = 2 * s;
  c.beginPath(); c.moveTo(x + 4 * s, y - 150 * s); c.lineTo(x + 114 * s, y - 20 * s); c.moveTo(x + 114 * s, y - 150 * s); c.lineTo(x + 4 * s, y - 20 * s); c.stroke();
  c.beginPath(); c.moveTo(x + 60 * s, y - 160 * s); c.lineTo(x + 230 * s, y - 150 * s); c.stroke();
}

function farHarbor(c: Ctx, w: number, h: number): void {
  const hy = h - 200; // horizon
  // sun haze sitting on the horizon
  const sg = c.createRadialGradient(w * 0.62, hy, 0, w * 0.62, hy, 520);
  sg.addColorStop(0, 'rgba(255,196,120,0.9)'); sg.addColorStop(0.3, 'rgba(240,140,80,0.35)'); sg.addColorStop(1, 'rgba(240,140,80,0)');
  c.fillStyle = sg; c.fillRect(0, 0, w, h);
  vgrad(c, 0, hy, w, h - hy, [[0, '#d98c55'], [0.12, '#7a5a4c'], [0.4, '#27495a'], [1, '#10303c']]);
  // sun glitter path
  const r = mulberry32(8);
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,205,140,${0.12 + r() * 0.35})`; c.fillRect(w * 0.62 + (r() - 0.5) * 240 * (0.3 + (i / 70)), hy + 4 + (i / 70) * 150, 14 + r() * 40, 1.5); }
  // distant freighters + container ship silhouettes
  const ship = (sx: number, sw: number, k: number): void => {
    const col = `rgb(${34 * k},${42 * k},${54 * k})`;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(sx, hy - 26); c.lineTo(sx + sw, hy - 26); c.lineTo(sx + sw - 18, hy + 2); c.lineTo(sx + 14, hy + 2); c.closePath(); c.fill();
    c.fillRect(sx + sw * 0.78, hy - 62, sw * 0.14, 36); c.fillRect(sx + sw * 0.82, hy - 74, sw * 0.04, 12);
    for (let cx = sx + 10; cx < sx + sw * 0.7; cx += 14) { const rows = 1 + Math.floor(r() * 3); for (let k2 = 0; k2 < rows; k2++) c.fillRect(cx, hy - 34 - k2 * 8, 12, 7); }
  };
  ship(120, 360, 1.05); ship(1260, 280, 0.9); ship(1700, 190, 0.8);
  // lighthouse on a rock
  c.fillStyle = '#2a323c'; c.beginPath(); c.moveTo(760, hy + 4); c.lineTo(790, hy - 14); c.lineTo(850, hy - 14); c.lineTo(880, hy + 4); c.fill();
  c.fillStyle = '#3a4048'; c.beginPath(); c.moveTo(806, hy - 14); c.lineTo(814, hy - 112); c.lineTo(832, hy - 112); c.lineTo(840, hy - 14); c.fill();
  c.fillStyle = '#7a2a24'; c.fillRect(811, hy - 80, 24, 12); c.fillRect(809, hy - 44, 28, 12);
  c.fillStyle = '#ffe9a8'; c.fillRect(814, hy - 126, 18, 14); c.fillStyle = '#2a323c'; c.fillRect(810, hy - 130, 26, 5);
  // far gantry cranes along a spit
  for (const cx of [1000, 1100, 1480]) canvasCrane(c, cx, hy + 2, 0.55, '#2a323c');
  vgrad(c, 0, hy - 40, w, 70, [[0, 'rgba(210,150,100,0)'], [0.5, 'rgba(210,150,100,0.16)'], [1, 'rgba(210,150,100,0)']]);
}

function midHarbor(c: Ctx, w: number, h: number): void {
  const r = mulberry32(44);
  // sparse structures so the sea of the far layer shows between them
  for (let x = 30; x < w; ) {
    const kind = r();
    if (kind < 0.38) { // sawtooth warehouse
      const bw = 200 + r() * 160, bh = 70 + r() * 50;
      const draw = (ox: number): void => {
        c.fillStyle = shade(DOCK.steel2, 0.7); c.fillRect(ox, h - bh, bw, bh);
        c.fillStyle = shade(DOCK.rustDark, 0.9);
        for (let sx = ox; sx < ox + bw; sx += 46) { c.beginPath(); c.moveTo(sx, h - bh); c.lineTo(sx + 46, h - bh - 26); c.lineTo(sx + 46, h - bh); c.fill(); }
        c.fillStyle = 'rgba(255,190,100,0.55)'; for (let wx = ox + 14; wx < ox + bw - 14; wx += 34) c.fillRect(wx, h - bh + 14, 14, 8);
        c.fillStyle = 'rgba(0,0,0,0.2)'; for (let lx = ox + 5; lx < ox + bw; lx += 8) c.fillRect(lx, h - bh, 1.5, bh);
      };
      wrapX(w, x, bw, draw); x += bw + 60 + r() * 140;
    } else if (kind < 0.75) { // container stacks
      const cols = 2 + Math.floor(r() * 3), rows = 2 + Math.floor(r() * 3);
      const draw = (ox: number): void => {
        for (let ci = 0; ci < cols; ci++) for (let ri = 0; ri < rows; ri++) {
          if (ri > 0 && r() < 0.18) continue;
          canvasContainer(c, ox + ci * 42, h - (ri + 1) * 22, 40, 20, CONTAINER_COLORS[Math.floor(r() * CONTAINER_COLORS.length)], 0.5 + r() * 0.18);
        }
      };
      wrapX(w, x, cols * 42, draw); x += cols * 42 + 50 + r() * 140;
    } else if (kind < 0.88) { // silos + stack
      const draw = (ox: number): void => {
        for (let i = 0; i < 3; i++) { c.fillStyle = shade(DOCK.steel2, 0.62); c.fillRect(ox + i * 40, h - 130, 34, 130); c.beginPath(); c.ellipse(ox + i * 40 + 17, h - 130, 17, 9, 0, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(ox + i * 40 + 4, h - 130, 4, 130); }
      };
      wrapX(w, x, 120, draw); x += 200 + r() * 120;
    } else { canvasCrane(c, x, h, 1.0, shade(DOCK.steel, 0.9)); x += 340 + r() * 200; }
  }
  vgrad(c, 0, h - 60, w, 60, [[0, 'rgba(40,30,28,0)'], [1, 'rgba(40,30,28,0.55)']]);
}

function nearHarbor(c: Ctx, w: number, h: number): void {
  const r = mulberry32(61);
  for (let x = 140; x < w; x += 480 + r() * 340) {
    const kind = r();
    c.fillStyle = '#0a0c10'; c.strokeStyle = '#0a0c10';
    if (kind < 0.5) { // gantry leg with X-bracing
      const lw = 44, lh = 360 + r() * 200;
      c.fillRect(x, h - lh, lw, lh);
      c.lineWidth = 5; c.beginPath(); c.moveTo(x + lw, h - lh + 30); c.lineTo(x + lw + 120, h - 30); c.moveTo(x + lw + 120, h - lh + 30); c.lineTo(x + lw, h - 30); c.stroke();
      c.fillRect(x + lw + 120, h - lh, lw, lh);
      c.fillRect(x - 20, h - lh - 14, lw * 2 + 160, 20);
      c.fillStyle = 'rgba(200,100,40,0.5)'; c.fillRect(x + 2, h - lh + 20, 3, lh - 40);
    } else { // mooring mast with hanging chains
      c.fillRect(x, h - 300, 20, 300); c.fillRect(x - 40, h - 310, 100, 12);
      c.lineWidth = 3; c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(x - 30, h - 300); c.quadraticCurveTo(x - 60, h - 200, x - 40, h - 130); c.stroke(); c.setLineDash([]);
      c.fillStyle = 'rgba(255,170,80,0.8)'; c.fillRect(x - 36, h - 312, 12, 6);
    }
  }
}

const art: BackdropArt = {
  sky: [[0, '#26323f'], [0.4, '#5d5868'], [0.75, '#b8704a'], [1, '#e3a066']],
  far: { w: 2048, h: 520, draw: farHarbor },
  mid: { w: 2048, h: 420, draw: midHarbor },
  near: { w: 2048, h: 660, draw: nearHarbor },
};

/* ------------------------------------------------------------------ backdrop animation */

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  const { w, h, zoom, t } = f;
  g.clear();
  // sweeping lighthouse beam
  const lx = f.sx(0.1, 820), ly = f.sy(0.1, 0.88, 322);
  const a = Math.sin(t * 0.5) * 0.9 - 0.2;
  g.fillStyle(0xfff0b8, 0.10).fillTriangle(lx, ly, lx + Math.cos(a - 0.07) * 700 * zoom, ly + Math.sin(a - 0.07) * 60 * zoom, lx + Math.cos(a + 0.07) * 700 * zoom, ly - Math.sin(a + 0.07) * 60 * zoom - 10 * zoom);
  g.fillStyle(0xfff0b8, 0.5).fillCircle(lx, ly, 16 * zoom);
  // a tug crossing the bay slowly, trailing smoke
  const span = w + 600 * zoom, tx = ((t * 16 * zoom) % span) - 300 * zoom - f.midX * 0.04 * zoom;
  const ty = f.sy(0.1, 0.88, 150);
  g.fillStyle(0x16202a, 1).fillRect(tx, ty - 10 * zoom, 70 * zoom, 12 * zoom).fillRect(tx + 36 * zoom, ty - 26 * zoom, 22 * zoom, 16 * zoom).fillRect(tx + 14 * zoom, ty - 24 * zoom, 5 * zoom, 14 * zoom);
  for (let i = 0; i < 5; i++) g.fillStyle(0x6a6a6a, 0.3 - i * 0.05).fillCircle(tx + 16 * zoom - i * 14 * zoom, ty - 30 * zoom - i * 4 * zoom, (5 + i * 3) * zoom);
  // sea shimmer
  g.fillStyle(0xffd9a0, 0.14);
  for (let i = 0; i < 16; i++) {
    const sx = ((hash(i) * w + t * (10 + hash(i + 3) * 14) * zoom - f.midX * 0.1 * zoom) % w + w) % w;
    g.fillRect(sx, f.sy(0.1, 0.88, 12 + hash(i + 9) * 150), (20 + hash(i + 5) * 40) * zoom, 1.5 * zoom);
  }
  // gulls riding the wind
  g.lineStyle(2 * zoom, 0x1c2630, 0.9);
  for (let i = 0; i < 5; i++) {
    const gx = ((hash(i * 5) * w + t * (36 + i * 6) * zoom) % (w + 100 * zoom)) - 50 * zoom;
    const gy = h * (0.16 + 0.1 * hash(i)) + Math.sin(t * 0.8 + i) * 12 * zoom;
    const flap = Math.sin(t * 7 + i * 2) * 5 * zoom;
    g.beginPath(); g.moveTo(gx - 10 * zoom, gy - flap); g.lineTo(gx, gy); g.lineTo(gx + 10 * zoom, gy - flap); g.strokePath();
  }
  // low sea fog drifting across
  for (let i = 0; i < 4; i++) {
    const fx = ((hash(i + 20) * w + t * (6 + i * 3) * zoom) % (w + 700 * zoom)) - 350 * zoom;
    g.fillStyle(0xe8d6c4, 0.07).fillEllipse(fx, f.sy(0.12, 0.88, 120 + i * 20), 700 * zoom, 50 * zoom);
  }
}

/* ------------------------------------------------------------------ container / structure drawing */

export function drawContainer(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, col: number, seed: number): void {
  g.fillStyle(col, 1).fillRect(x, y, w, h);
  g.fillStyle(0x000000, 0.2);
  for (let cx = x + 5; cx < x + w - 4; cx += 8) g.fillRect(cx, y + 3, 3, h - 6);
  g.fillStyle(0xffffff, 0.10);
  for (let cx = x + 8; cx < x + w - 4; cx += 8) g.fillRect(cx, y + 3, 1, h - 6);
  g.fillStyle(0x000000, 0.45).fillRect(x, y, w, 3).fillRect(x, y + h - 3, w, 3);
  g.fillStyle(0x1a1a1a, 0.6).fillRect(x, y, 5, h).fillRect(x + w - 5, y, 5, h);
  // rust streaks + stencil plate
  g.fillStyle(DOCK.rustDark, 0.45);
  for (let i = 0; i < 3; i++) g.fillRect(x + 10 + hash(seed + i) * (w - 24), y + 3, 3 + hash(seed + i * 2) * 5, h * (0.3 + hash(seed + i * 3) * 0.6));
  g.fillStyle(0xf0e6d2, 0.55).fillRect(x + w * 0.2, y + h * 0.35, w * 0.22, 4);
  g.fillStyle(0xf0e6d2, 0.35).fillRect(x + w * 0.2, y + h * 0.35 + 7, w * 0.14, 3);
}

function containerStack(g: Phaser.GameObjects.Graphics, d: { x: number; y: number; w: number; h: number; seed: number }): void {
  const ch = 44, cw = 120;
  const rows = Math.ceil(d.h / ch);
  for (let ri = 0; ri < rows; ri++) {
    const y = d.y + d.h - (ri + 1) * ch;
    if (y < d.y - 4) break;
    for (let cx = d.x, ci = 0; cx < d.x + d.w; cx += cw, ci++) {
      const w = Math.min(cw, d.x + d.w - cx);
      const col = CONTAINER_COLORS[Math.floor(hash(d.seed + ri * 7 + ci * 3) * CONTAINER_COLORS.length)];
      drawContainer(g, cx, y, w - 2, ch - 2, col, d.seed + ri * 11 + ci);
    }
  }
  g.fillStyle(0x000000, 0.28).fillRect(d.x, d.y, d.w, d.h); // the stack sits in the pier's shadow
}

function craneStatic(g: Phaser.GameObjects.Graphics, d: { x: number; y: number; w: number; h: number }): void {
  const lx = d.x, rx = d.x + d.w, top = d.y - d.h;
  g.fillStyle(DOCK.steel2, 1);
  g.fillRect(lx - 9, top, 18, d.h).fillRect(rx - 9, top, 18, d.h);
  g.fillStyle(DOCK.mustard, 1).fillRect(lx - 9, top + d.h * 0.45, 18, 14).fillRect(rx - 9, top + d.h * 0.45, 18, 14);
  g.lineStyle(5, DOCK.steel2, 1);
  g.lineBetween(lx, top + 30, rx, d.y - 30); g.lineBetween(rx, top + 30, lx, d.y - 30);
  g.lineBetween(lx, top + d.h * 0.5, rx, top + 30);
  g.fillStyle(DOCK.rust, 1).fillRect(lx - 30, top - 16, d.w + 60 + d.w * 0.7, 22); // main girder + boom extending to the right
  g.lineStyle(3, DOCK.steel, 1);
  for (let x = lx - 30; x < rx + d.w * 0.7; x += 34) { g.lineBetween(x, top + 6, x + 17, top - 26); g.lineBetween(x + 17, top - 26, x + 34, top + 6); }
  g.fillStyle(DOCK.steel, 1).fillRect(lx - 30, top - 28, d.w + 60 + d.w * 0.7, 6);
  g.fillStyle(DOCK.mustard, 1).fillRect(lx - 9, top - 62, 70, 38); // operator cab
  g.fillStyle(0xffe9a8, 0.8).fillRect(lx - 3, top - 56, 28, 18);
  g.fillStyle(0xff4d3d, 1).fillRect(rx + d.w * 0.7 + 20, top - 24, 6, 6);
  g.fillStyle(0x000000, 0.2).fillRect(lx - 9, top + d.h * 0.75, 18, d.h * 0.25).fillRect(rx - 9, top + d.h * 0.75, 18, d.h * 0.25);
}

function shipHull(g: Phaser.GameObjects.Graphics, d: { x: number; y: number; w: number; h: number; seed: number }): void {
  const { x, y, w, h } = d;
  // hull: black waterline, oxblood body, flared bow on the right
  g.fillStyle(0x1b1f26, 1).fillRect(x, y + h - 60, w, 60);
  g.fillStyle(0x7a2a24, 1).fillPoints([{ x, y: y + h - 60 }, { x: x + w - 10, y: y + h - 60 }, { x: x + w + 90, y: y + 20 }, { x, y: y + 20 }], true);
  g.fillStyle(0xe8dcc8, 0.9).fillRect(x, y + 20, w + 80, 8);
  g.fillStyle(0x000000, 0.25).fillRect(x, y + h - 120, w, 60);
  for (let px = x + 40; px < x + w - 40; px += 90) { g.fillStyle(0x1b1f26, 1).fillCircle(px, y + 80, 11); g.fillStyle(0xffd790, 0.55).fillCircle(px, y + 80, 7); }
  g.fillStyle(0xf0e6d2, 0.7).fillRect(x + 60, y + h - 136, 160, 10);
  // deck cargo
  for (let cx = x + 30, ci = 0; cx < x + w - 360; cx += 62, ci++) for (let ri = 0; ri < 2 + Math.floor(hash(d.seed + ci) * 3); ri++)
    drawContainer(g, cx, y - 34 - ri * 34, 58, 32, CONTAINER_COLORS[Math.floor(hash(d.seed + ci * 5 + ri) * CONTAINER_COLORS.length)], d.seed + ci + ri);
  // bridge tower and funnel
  const bx = x + w - 300;
  g.fillStyle(0xe8e0d0, 1).fillRect(bx, y - 150, 170, 150);
  g.fillStyle(0xcfc6b2, 1).fillRect(bx + 20, y - 210, 130, 62);
  g.fillStyle(0x1a2a3a, 1).fillRect(bx + 28, y - 190, 114, 22);
  g.fillStyle(0xffd790, 0.5).fillRect(bx + 28, y - 190, 114, 22);
  g.fillStyle(0xe8e0d0, 1).fillRect(bx + 80, y - 250, 8, 40);
  g.fillStyle(0xa8532b, 1).fillRect(bx + 190, y - 130, 54, 130);
  g.fillStyle(0x15171c, 1).fillRect(bx + 190, y - 130, 54, 20);
  g.fillStyle(0xff4d3d, 1).fillRect(bx + 82, y - 256, 4, 6);
  for (let wy = y - 130; wy < y - 10; wy += 24) for (let wx = bx + 12; wx < bx + 160; wx += 26) g.fillStyle(0x1a2a3a, 1).fillRect(wx, wy, 16, 11);
}

/* ------------------------------------------------------------------ theme */

export const docksTheme: WorldTheme = {
  id: 'docks',
  accent: DOCK.rust,
  backdrop: art,
  backdropFx,
  bed: {
    top: GROUND_Y + 36,
    draw(g, x0, x1, t) {
      const top = GROUND_Y + 36;
      const rise = Math.max(0, 1 - (t - surge.since) / 2.4) * 30 * (surge.since > 0 ? 1 : 0);
      const y0 = top - rise;
      g.fillStyle(DOCK.seaDeep, 1).fillRect(x0, y0, x1 - x0, 1080 - y0 + 40);
      g.fillStyle(DOCK.sea, 1).fillRect(x0, y0, x1 - x0, 34);
      g.fillStyle(0x4a7a86, 0.5);
      for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) g.fillRect(x + Math.sin(t * 1.6 + x * 0.05) * 14, y0 + 2, 40, 2);
      g.fillStyle(0xcfe4e4, 0.35);
      for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) g.fillRect(x + Math.sin(t * 1.1 + x * 0.1) * 20, y0 + 14 + Math.sin(t + x) * 3, 26, 2);
      g.fillStyle(0x000000, 0.28).fillRect(x0, y0 + 40, x1 - x0, 80);
    },
  },

  drawSolid(g, s) {
    switch (s.kind) {
      case 'ground': { // timber pier on pilings, open water between them
        g.fillStyle(DOCK.rust, 1).fillRect(s.x, s.y, s.w, 5); // steel kerb
        g.fillStyle(DOCK.rustDark, 1).fillRect(s.x, s.y + 5, s.w, 2);
        for (let x = s.x, i = 0; x < s.x + s.w; x += 38, i++) { // planks
          const k = hash(x * 0.13 + 3);
          g.fillStyle(k > 0.5 ? DOCK.wood : 0x5a3d22, 1).fillRect(x, s.y + 7, 37, 24);
          g.fillStyle(0x000000, 0.35).fillRect(x + 37, s.y + 7, 1, 24);
          if (k > 0.8) g.fillStyle(0xffffff, 0.06).fillRect(x, s.y + 7, 37, 8);
        }
        g.fillStyle(0x24170b, 1).fillRect(s.x, s.y + 31, s.w, 9); // stringers
        for (let x = s.x + 90; x < s.x + s.w; x += 180) { // pilings with rope wraps and a barnacle band
          g.fillStyle(0x3d2a17, 1).fillRect(x, s.y + 40, 24, s.h - 40);
          g.fillStyle(0x5c4426, 1).fillRect(x, s.y + 40, 6, s.h - 40);
          g.fillStyle(0xc9b88a, 0.7).fillRect(x, s.y + 52, 24, 4).fillRect(x, s.y + 60, 24, 4);
          g.fillStyle(0x6a7a6a, 0.6).fillRect(x, s.y + 82, 24, 20);
          g.lineStyle(3, 0x2a1d10, 1).lineBetween(x + 24, s.y + 44, x + 156, s.y + 100);
        }
        for (let x = s.x + 60; x < s.x + s.w; x += 360) { // cleats/bollards
          g.fillStyle(0x15171c, 1).fillRect(x, s.y - 12, 20, 12);
          g.fillStyle(0x15171c, 1).fillRect(x - 5, s.y - 18, 30, 7);
        }
        g.fillStyle(0xf0e6d2, 0.55);
        for (let x = s.x + 20; x < s.x + s.w; x += 220) g.fillRect(x, s.y + 12, 70, 4); // painted line
        break;
      }
      case 'roof': { // container roof / shed roof
        const n = Math.max(1, Math.round(s.w / 120)), cw = s.w / n;
        for (let i = 0; i < n; i++) {
          const col = CONTAINER_COLORS[Math.floor(hash(s.x * 0.01 + i * 3.1) * CONTAINER_COLORS.length)];
          g.fillStyle(col, 1).fillRect(s.x + i * cw, s.y, cw, s.h);
          g.fillStyle(0xffffff, 0.14).fillRect(s.x + i * cw, s.y, cw, 4);
          g.fillStyle(0x000000, 0.25);
          for (let rx = s.x + i * cw + 5; rx < s.x + (i + 1) * cw - 3; rx += 8) g.fillRect(rx, s.y + 6, 2, s.h - 10);
          g.fillStyle(0x15171c, 0.8).fillRect(s.x + i * cw, s.y, 2, s.h);
        }
        g.fillStyle(0x000000, 0.4).fillRect(s.x, s.y + s.h - 4, s.w, 4);
        g.fillStyle(DOCK.rustDark, 0.35);
        for (let x = s.x + 30; x < s.x + s.w; x += 90) g.fillRect(x, s.y + 4, 20, 6);
        break;
      }
      case 'crate': { // wooden cargo crates
        const rows = Math.max(1, Math.round(s.h / 70));
        const ch = s.h / rows;
        for (let r = 0; r < rows; r++) {
          const y = s.y + r * ch;
          g.fillStyle(DOCK.wood, 1).fillRect(s.x, y, s.w, ch);
          g.fillStyle(0x000000, 0.2); for (let py = y + 14; py < y + ch; py += 16) g.fillRect(s.x, py, s.w, 2);
          g.lineStyle(5, DOCK.woodDark, 1).strokeRect(s.x + 3, y + 3, s.w - 6, ch - 6);
          g.lineBetween(s.x + 4, y + 4, s.x + s.w - 4, y + ch - 4);
          g.fillStyle(0x15171c, 1).fillRect(s.x, y, 9, 9).fillRect(s.x + s.w - 9, y, 9, 9).fillRect(s.x, y + ch - 9, 9, 9).fillRect(s.x + s.w - 9, y + ch - 9, 9, 9);
        }
        g.fillStyle(0xf0e6d2, 0.55).fillRect(s.x + 22, s.y + 18, 36, 5);
        g.fillStyle(0xffffff, 0.12).fillRect(s.x, s.y, s.w, 4);
        break;
      }
      case 'wall': {
        g.fillStyle(DOCK.steel2, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0x000000, 0.25); for (let y = s.y; y < s.y + s.h; y += 40) g.fillRect(s.x, y, s.w, 3);
        g.fillStyle(DOCK.rust, 0.7).fillRect(s.x, s.y, 4, s.h);
        break;
      }
      case 'gate': {
        g.fillStyle(DOCK.steel2, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(DOCK.mustard, 1);
        for (let y = s.y; y < s.y + s.h; y += 40) g.fillTriangle(s.x, y + 20, s.x + s.w, y, s.x + s.w, y + 20);
        break;
      }
    }
  },

  drawLedge(g, o) { // crane-slung steel gangway
    g.fillStyle(DOCK.steel2, 1).fillRect(o.x, o.y, o.w, 8);
    g.fillStyle(DOCK.mustard, 1).fillRect(o.x, o.y, o.w, 2);
    g.fillStyle(0x15171c, 1);
    for (let x = o.x + 6; x < o.x + o.w - 4; x += 12) g.fillRect(x, o.y + 3, 6, 4);
    g.fillStyle(DOCK.steel, 1).fillRect(o.x, o.y + 8, o.w, 4);
    g.lineStyle(3, DOCK.steel, 1);
    for (let x = o.x + 14; x < o.x + o.w - 6; x += 40) { g.lineBetween(x, o.y + 12, x - 14, o.y + 30); g.lineBetween(x - 14, o.y + 30, x - 28, o.y + 12); }
    g.fillStyle(DOCK.rust, 0.6).fillRect(o.x + 4, o.y + 8, 30, 3);
    // slings up to an unseen hook
    g.lineStyle(2, 0x15171c, 0.85);
    g.lineBetween(o.x + 8, o.y, o.x + o.w / 2, o.y - 96); g.lineBetween(o.x + o.w - 8, o.y, o.x + o.w / 2, o.y - 96);
    g.fillStyle(0x15171c, 1).fillCircle(o.x + o.w / 2, o.y - 98, 5);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'container_stack': containerStack(g, d); break;
      case 'warehouse': {
        g.fillStyle(DOCK.steel2, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x000000, 0.22);
        for (let x = d.x + 6; x < d.x + d.w; x += 12) g.fillRect(x, d.y, 3, d.h);
        g.fillStyle(0xffffff, 0.07);
        for (let x = d.x + 9; x < d.x + d.w; x += 12) g.fillRect(x, d.y, 1, d.h);
        g.fillStyle(DOCK.rustDark, 0.8).fillRect(d.x, d.y, d.w, 14);
        g.fillStyle(DOCK.rust, 1).fillRect(d.x, d.y + 14, d.w, 3);
        for (let x = d.x + 30; x < d.x + d.w - 90; x += 220) { // roll-up doors with a lamp
          g.fillStyle(0x15171c, 1).fillRect(x, d.y + d.h - 150, 100, 150);
          g.fillStyle(DOCK.steel, 1); for (let y = d.y + d.h - 146; y < d.y + d.h; y += 12) g.fillRect(x + 4, y, 92, 8);
          g.fillStyle(0xffb347, 0.5).fillCircle(x + 50, d.y + d.h - 166, 16);
          g.fillStyle(0xffd790, 1).fillCircle(x + 50, d.y + d.h - 166, 5);
        }
        g.fillStyle(DOCK.rustDark, 0.4);
        for (let i = 0; i < d.w / 90; i++) g.fillRect(d.x + hash(d.seed + i) * d.w, d.y + 17, 6, 30 + hash(i * 3) * 70);
        break;
      }
      case 'crane': craneStatic(g, d); break;
      case 'ship': shipHull(g, d); break;
      case 'bollard': {
        g.fillStyle(0x15171c, 1).fillRect(d.x, d.y - 36, 26, 36).fillRect(d.x - 7, d.y - 42, 40, 10);
        g.lineStyle(5, 0xc9b88a, 0.9).lineBetween(d.x + 13, d.y - 40, d.x + 150, d.y + 40);
        break;
      }
      case 'barrels': {
        for (let i = 0; i < 3; i++) {
          const bx = d.x + i * 34 + (i === 2 ? -17 : 0), by = d.y - (i === 2 ? 74 : 40);
          g.fillStyle([DOCK.red, DOCK.rust, DOCK.mustard][(d.seed + i) % 3], 1).fillRect(bx, by, 30, 40);
          g.fillStyle(0x000000, 0.35).fillRect(bx, by + 10, 30, 2).fillRect(bx, by + 28, 30, 2);
          g.fillStyle(0xffffff, 0.15).fillRect(bx + 3, by, 4, 40);
        }
        break;
      }
      case 'lamp': { // floodlight mast
        g.fillStyle(DOCK.steel, 1).fillRect(d.x - 4, d.y - d.h, 8, d.h);
        g.fillRect(d.x - 4, d.y - d.h, 8, d.h);
        g.fillStyle(DOCK.steel2, 1).fillRect(d.x - 26, d.y - d.h - 6, 52, 16);
        for (let i = -1; i <= 1; i++) g.fillStyle(0xfff0c8, 1).fillRect(d.x + i * 16 - 5, d.y - d.h - 2, 10, 8);
        g.fillStyle(0xffe6a8, 0.07).fillTriangle(d.x - 20, d.y - d.h + 10, d.x + 20, d.y - d.h + 10, d.x + 110, d.y).fillTriangle(d.x - 20, d.y - d.h + 10, d.x + 20, d.y - d.h + 10, d.x - 110, d.y);
        break;
      }
      case 'sign': { // hand-painted board
        g.fillStyle(DOCK.steel, 1).fillRect(d.x + 8, d.y + d.h, 6, 60).fillRect(d.x + d.w - 14, d.y + d.h, 6, 60);
        g.fillStyle(0x1d242c, 1).fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(3, 0xf0e6d2, 0.85).strokeRect(d.x + 4, d.y + 4, d.w - 8, d.h - 8);
        g.fillStyle(DOCK.rustDark, 0.5).fillRect(d.x + 6, d.y + 6, 24, d.h - 12);
        ctx.text(d, 0xf0e6d2);
        break;
      }
      case 'neon': { // dock stencils replace neon here: same data, rust-board look
        g.fillStyle(DOCK.steel, 1).fillRect(d.x + 8, d.y + d.h, 6, 40).fillRect(d.x + d.w - 14, d.y + d.h, 6, 40);
        g.fillStyle(0x1d242c, 1).fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(2, 0xf0e6d2, 0.8).strokeRect(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
        ctx.text(d, 0xf0e6d2);
        break;
      }
      case 'pipes': {
        g.fillStyle(DOCK.rustDark, 1).fillRect(d.x, d.y, d.w, 12).fillRect(d.x, d.y + 26, d.w, 8);
        g.fillStyle(DOCK.rust, 0.6).fillRect(d.x, d.y, d.w, 3);
        for (let x = d.x; x < d.x + d.w; x += 150) { g.fillStyle(DOCK.steel, 1).fillRect(x, d.y, 10, d.h); g.fillStyle(DOCK.red, 1).fillCircle(x + 5, d.y + 6, 7); }
        break;
      }
      case 'banner': break; // flag is animated; pole is static
      case 'arrow': break;
      case 'door': {
        g.fillStyle(0x15171c, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(DOCK.steel, 1); for (let y = d.y + 6; y < d.y + d.h; y += 14) g.fillRect(d.x + 4, y, d.w - 8, 9);
        g.lineStyle(5, DOCK.mustard, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(DOCK.mustard, 0.12).fillRect(d.x, d.y, d.w, d.h);
        if (d.text) ctx.text({ ...d, y: d.y - 34, h: 24 }, 0xf0e6d2);
        break;
      }
      case 'chain': { // hanging chain with a hook, over the actors
        g.lineStyle(4, 0x0d0f12, 0.9);
        for (let y = d.y; y < d.y + d.h; y += 12) g.strokeEllipse(d.x, y + 6, 8, 12);
        g.lineStyle(5, 0x0d0f12, 0.9).beginPath().moveTo(d.x, d.y + d.h).lineTo(d.x, d.y + d.h + 20).strokePath();
        g.fillStyle(0x0d0f12, 0.9).fillTriangle(d.x - 9, d.y + d.h + 18, d.x + 9, d.y + d.h + 18, d.x, d.y + d.h + 34);
        break;
      }
      case 'welder': {
        g.fillStyle(DOCK.steel, 1).fillRect(d.x, d.y - 8, 24, 8);
        break;
      }
    }
  },

  animated: {
    crane: {
      layer: 'back', pad: 600,
      draw(g, d, t) { // trolley runs the boom; the load swings on its cable
        const top = d.y - d.h, bx0 = d.x + 30, bx1 = d.x + d.w + d.w * 0.7;
        const u = 0.5 + 0.5 * Math.sin(t * 0.22 + d.seed * 0.01);
        const tx = bx0 + (bx1 - bx0) * u;
        const drop = 140 + 90 * (0.5 + 0.5 * Math.sin(t * 0.37 + d.seed));
        const sway = Math.sin(t * 1.4 + d.seed) * 6;
        g.fillStyle(DOCK.steel, 1).fillRect(tx - 18, top - 4, 36, 14);
        g.lineStyle(2, 0x0d0f12, 1).lineBetween(tx, top + 8, tx + sway, top + drop);
        g.fillStyle(0x0d0f12, 1).fillRect(tx + sway - 10, top + drop, 20, 10);
        drawContainer(g, tx + sway - 50, top + drop + 10, 100, 40, CONTAINER_COLORS[Math.floor(hash(d.seed) * 6)], d.seed);
        g.lineStyle(1.5, 0x0d0f12, 1).lineBetween(tx + sway - 6, top + drop + 10, tx + sway - 46, top + drop + 10).lineBetween(tx + sway + 6, top + drop + 10, tx + sway + 46, top + drop + 10);
      },
    },
    lamp: {
      layer: 'back', pad: 140,
      draw(g, d, t) {
        const fl = hash(Math.floor(t * 9) + d.seed) > 0.95 ? 0.35 : 1;
        g.fillStyle(0xffe6a8, 0.18 * fl).fillCircle(d.x, d.y - d.h + 4, 56);
      },
    },
    banner: {
      layer: 'back', pad: 90,
      draw(g, d, t) { // tattered flag whipping in the sea wind
        g.fillStyle(DOCK.steel, 1).fillRect(d.x + d.w / 2 - 2, d.y, 4, d.h + 40);
        g.fillStyle(DOCK.red, 1);
        const x0 = d.x + d.w / 2 + 2;
        g.beginPath(); g.moveTo(x0, d.y + 4);
        for (let i = 0; i <= 10; i++) g.lineTo(x0 + i * 9, d.y + 4 + Math.sin(t * 5 + i * 0.7) * (2 + i * 0.8));
        for (let i = 10; i >= 0; i--) g.lineTo(x0 + i * 9 + (i === 10 ? -10 : 0), d.y + 54 + Math.sin(t * 5 + i * 0.7) * (2 + i * 0.8));
        g.closePath(); g.fillPath();
        g.fillStyle(0xf0e6d2, 0.8).fillCircle(x0 + 28, d.y + 28 + Math.sin(t * 5 + 3) * 3, 8);
      },
    },
    welder: {
      layer: 'front', pad: 60,
      draw(g, d, t) {
        const on = hash(Math.floor(t * 14) + d.seed) > 0.35;
        if (!on) return;
        g.fillStyle(0xbfe6ff, 0.22).fillCircle(d.x + 14, d.y - 14, 36);
        g.fillStyle(0xffffff, 1).fillCircle(d.x + 14, d.y - 12, 4);
        g.fillStyle(0xffd24a, 1);
        for (let i = 0; i < 8; i++) { const a = hash(i + t * 20) * 6.28, r = 8 + hash(i * 3 + t * 20) * 24; g.fillRect(d.x + 14 + Math.cos(a) * r, d.y - 12 + Math.abs(Math.sin(a)) * r + (r * r) / 90, 2, 2); }
      },
    },
    ship: {
      layer: 'back', pad: 200,
      draw(g, d, t) { // funnel smoke + riding lights
        const fx = d.x + d.w - 300 + 217, fy = d.y - 130;
        for (let i = 0; i < 6; i++) {
          const u = (t * 0.2 + i / 6) % 1;
          g.fillStyle(0x4a4a4a, 0.5 * (1 - u)).fillCircle(fx + u * 120, fy - u * 160, 12 + u * 34);
        }
        g.fillStyle(0xffffff, 0.6 + 0.4 * Math.sin(t * 3)).fillRect(d.x + d.w - 216, d.y - 258, 4, 4);
      },
    },
  },

  ambient(scene): AmbientParticles {
    surge.since = -99;
    const g = scene.add.graphics().setDepth(67);
    return {
      update(_dt, view, t) { // drifting harbour mist + sea spray
        g.clear();
        for (let i = 0; i < 6; i++) {
          const mx = view.left + (((hash(i) * view.width * 1.4 + t * (14 + i * 4)) % (view.width * 1.4)) - view.width * 0.2);
          g.fillStyle(0xe8d6c4, 0.045).fillEllipse(mx, GROUND_Y - 20 - i * 40, 520, 70);
        }
        g.fillStyle(0xdff0f0, 0.5);
        for (let i = 0; i < 22; i++) {
          const u = (t * 0.8 + hash(i)) % 1;
          const sx = view.left + hash(i * 4) * view.width;
          g.fillRect(sx, GROUND_Y + 30 - Math.sin(u * Math.PI) * 40, 2, 2);
        }
      },
    };
  },
};
