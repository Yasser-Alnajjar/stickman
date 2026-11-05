import type Phaser from 'phaser';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, hash, mulberry32, vgrad, wrapX } from '../../kit';

type Ctx = CanvasRenderingContext2D;
type G = Phaser.GameObjects.Graphics;

export const DUNE = {
  sand: 0xdcb878, sandDark: 0xa87b45, stone: 0xcfa468, stoneDark: 0x8a6034, shade: 0x5b3d1f, gold: 0xf2c84a, turq: 0x2fb8a6, red: 0xb8452a, ink: 0x2a1a0e,
} as const;

/* ------------------------------------------------------------------ backdrop */

function farDunes(c: Ctx, w: number, h: number): void {
  const r = mulberry32(8);
  for (let layer = 0; layer < 3; layer++) {
    c.fillStyle = ['#b8683f', '#a35a38', '#8a4a30'][layer];
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) c.lineTo(x, h - 110 - layer * 55 - (Math.sin(x * 0.005 + layer * 2) * 0.5 + 0.5) * 130 - r() * 10);
    c.lineTo(w, h); c.closePath(); c.fill();
  }
  // far pyramids on the horizon
  for (const px of [380, 1180, 1750]) {
    const pw = 240 + (px % 3) * 40;
    c.fillStyle = '#8a4a30'; c.beginPath(); c.moveTo(px - pw / 2, h - 180); c.lineTo(px, h - 180 - pw * 0.7); c.lineTo(px + pw / 2, h - 180); c.fill();
    c.fillStyle = '#6e3a26'; c.beginPath(); c.moveTo(px, h - 180 - pw * 0.7); c.lineTo(px + pw / 2, h - 180); c.lineTo(px, h - 180); c.fill();
  }
  // caravan silhouette
  c.fillStyle = '#3d2216';
  for (let i = 0; i < 5; i++) { const x = 1300 + i * 34; c.fillRect(x, h - 205, 16, 10); c.fillRect(x + 12, h - 218, 6, 14); c.fillRect(x + 2, h - 195, 3, 10); c.fillRect(x + 12, h - 195, 3, 10); }
  vgrad(c, 0, h - 110, w, 110, [[0, 'rgba(255,200,130,0)'], [1, 'rgba(255,200,130,0.45)']]);
}

function midCity(c: Ctx, w: number, h: number): void {
  const r = mulberry32(21);
  for (let x = 20; x < w; x += 180 + r() * 200) {
    const k = r(), bw = 130 + r() * 110, bh = 130 + r() * 150;
    wrapX(w, x, bw + 40, (ox) => {
      c.fillStyle = '#7d4a2c';
      if (k < 0.4) { // domed hall
        c.fillRect(ox, h - bh, bw, bh);
        c.beginPath(); c.arc(ox + bw / 2, h - bh, bw * 0.45, Math.PI, 0); c.fill(); c.fillRect(ox + bw / 2 - 3, h - bh - bw * 0.45 - 24, 6, 24);
        c.fillStyle = '#ffd36a'; c.fillRect(ox + bw / 2 - 2, h - bh - bw * 0.45 - 30, 4, 8);
      } else if (k < 0.7) { // minaret
        c.fillRect(ox + bw / 2 - 16, h - bh - 120, 32, bh + 120); c.beginPath(); c.moveTo(ox + bw / 2 - 22, h - bh - 120); c.lineTo(ox + bw / 2, h - bh - 170); c.lineTo(ox + bw / 2 + 22, h - bh - 120); c.fill();
      } else { // crenellated wall
        c.fillRect(ox, h - bh * 0.6, bw + 60, bh * 0.6); for (let i = 0; i < 8; i++) c.fillRect(ox + i * 22, h - bh * 0.6 - 12, 12, 12);
      }
      c.fillStyle = 'rgba(255,205,110,0.75)'; for (let i = 0; i < 3; i++) c.fillRect(ox + 26 + i * 34, h - bh * 0.4 - (i % 2) * 40, 12, 20);
    });
  }
  vgrad(c, 0, h - 60, w, 60, [[0, 'rgba(240,170,100,0)'], [1, 'rgba(240,170,100,0.5)']]);
}

function nearPalms(c: Ctx, w: number, h: number): void {
  const r = mulberry32(3);
  c.fillStyle = '#1d0f08'; c.strokeStyle = '#1d0f08';
  for (let x = 90; x < w; x += 460 + r() * 380) {
    const ph = 300 + r() * 220;
    wrapX(w, x - 100, 220, (ox) => {
      c.lineWidth = 14; c.beginPath(); c.moveTo(ox, h); c.quadraticCurveTo(ox + 30, h - ph * 0.5, ox + 10, h - ph); c.stroke();
      c.lineWidth = 5;
      for (let i = 0; i < 7; i++) { const a = -2.9 + i * 0.45; c.beginPath(); c.moveTo(ox + 10, h - ph); c.quadraticCurveTo(ox + 10 + Math.cos(a) * 60, h - ph - 50 + Math.sin(a) * 10, ox + 10 + Math.cos(a) * 110, h - ph + 20 + Math.sin(a) * 30); c.stroke(); }
    });
  }
}

const art: BackdropArt = {
  sky: [[0, '#63302a'], [0.3, '#c8683f'], [0.65, '#f2a860'], [1, '#ffe2a2']],
  far: { w: 2048, h: 520, draw: farDunes },
  mid: { w: 2048, h: 400, draw: midCity },
  near: { w: 2048, h: 640, draw: nearPalms },
};

function backdropFx(g: G, f: BackdropFrame): void {
  const { w, h, zoom, t } = f;
  g.clear();
  const sx = f.sx(0.05, 900), sy = h * 0.32 + (f.sy(0.05, 0.9, 0) - h * 0.9) * 0.1;
  g.fillStyle(0xffe9a0, 0.12).fillCircle(sx, sy, 170 * zoom).fillStyle(0xfff0c0, 0.22).fillCircle(sx, sy, 100 * zoom).fillStyle(0xfffbe0, 0.95).fillCircle(sx, sy, 52 * zoom);
  for (let i = 0; i < 4; i++) { // shimmering heat bands
    const y = h * (0.58 + i * 0.05);
    g.fillStyle(0xffd9a0, 0.05 + 0.03 * Math.sin(t * 1.2 + i)).fillRect(0, y + Math.sin(t * 2 + i) * 3 * zoom, w, 8 * zoom);
  }
  for (let i = 0; i < 3; i++) { // vultures wheeling
    const a = t * 0.3 + i * 2.1, vx = w * (0.3 + 0.2 * i) + Math.cos(a) * 120 * zoom, vy = h * (0.18 + 0.05 * i) + Math.sin(a * 1.3) * 26 * zoom;
    g.lineStyle(2 * zoom, 0x2a1810, 0.9).beginPath().moveTo(vx - 12 * zoom, vy + 3 * zoom).lineTo(vx, vy).lineTo(vx + 12 * zoom, vy + 3 * zoom).strokePath();
  }
}

/* ------------------------------------------------------------------ helpers */

function sandBlocks(g: G, x: number, y: number, w: number, h: number, base: number, seed: number): void {
  g.fillStyle(base, 1).fillRect(x, y, w, h);
  g.lineStyle(2, DUNE.shade, 0.4);
  for (let row = 0, yy = y + 28; yy < y + h; row++, yy += 28) { g.lineBetween(x, yy, x + w, yy); for (let xx = x + 60 + (row % 2) * 30; xx < x + w; xx += 90) g.lineBetween(xx, yy - 28, xx, yy); }
  g.fillStyle(0xffffff, 0.06).fillRect(x, y, w, 8);
  void seed;
}

function hiero(g: G, x: number, y: number, w: number, h: number, seed: number, col: number, a = 0.55): void {
  g.lineStyle(2, col, a);
  for (let i = 0, xx = x + 16; xx < x + w - 16; i++, xx += 34) {
    const k = Math.floor(hash(seed + i) * 5), cy = y + h / 2;
    if (k === 0) g.strokeCircle(xx, cy, 7).lineBetween(xx - 7, cy, xx + 7, cy);
    else if (k === 1) g.lineBetween(xx, cy - 10, xx + 10, cy + 10).lineBetween(xx + 10, cy + 10, xx + 20, cy - 10);
    else if (k === 2) { g.lineBetween(xx, cy + 10, xx, cy - 10); g.strokeCircle(xx, cy - 12, 4); }
    else if (k === 3) g.strokeRect(xx, cy - 8, 14, 16).lineBetween(xx, cy, xx + 14, cy);
    else g.beginPath().moveTo(xx, cy + 8).lineTo(xx + 8, cy - 10).lineTo(xx + 16, cy + 8).closePath().strokePath();
  }
}

function crenels(g: G, x: number, y: number, w: number, col: number): void {
  g.fillStyle(col, 1);
  for (let xx = x; xx < x + w - 10; xx += 34) g.fillRect(xx, y - 14, 20, 14);
}

/* ------------------------------------------------------------------ theme */

export const duneTheme: WorldTheme = {
  id: 'dune',
  accent: DUNE.gold,
  backdrop: art,
  backdropFx,

  drawSolid(g, s) {
    switch (s.kind) {
      case 'ground': {
        g.fillStyle(DUNE.sand, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(DUNE.sandDark, 1).fillRect(s.x, s.y + 22, s.w, s.h - 22);
        g.fillStyle(0xf0d79a, 1);
        for (let xx = s.x; xx < s.x + s.w; xx += 60) g.fillEllipse(xx + 30, s.y + 2, 70, 12);
        g.lineStyle(2, DUNE.shade, 0.3);
        for (let yy = s.y + 36; yy < s.y + s.h; yy += 26) g.lineBetween(s.x, yy, s.x + s.w, yy + (hash(s.x + yy) - 0.5) * 8);
        break;
      }
      case 'roof': {
        sandBlocks(g, s.x, s.y, s.w, s.h, DUNE.stone, s.x);
        g.fillStyle(DUNE.turq, 1).fillRect(s.x, s.y, s.w, 5);
        g.fillStyle(DUNE.gold, 1); for (let xx = s.x + 10; xx < s.x + s.w - 6; xx += 40) g.fillRect(xx, s.y + 8, 14, 6);
        crenels(g, s.x, s.y, s.w, DUNE.stone);
        break;
      }
      case 'crate': {
        sandBlocks(g, s.x, s.y, s.w, s.h, DUNE.stoneDark, s.x);
        g.lineStyle(3, DUNE.shade, 0.7).strokeRect(s.x, s.y, s.w, s.h);
        g.fillStyle(DUNE.gold, 0.7).fillRect(s.x, s.y, s.w, 4);
        break;
      }
      case 'gate': { sandBlocks(g, s.x, s.y, s.w, s.h, DUNE.shade, s.x); hiero(g, s.x, s.y + 40, s.w, 60, s.x, DUNE.gold, 0.9); g.lineStyle(4, DUNE.gold, 1).strokeRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8); break; }
      default: { sandBlocks(g, s.x, s.y, s.w, s.h, DUNE.stoneDark, s.x); hiero(g, s.x, s.y + 80, s.w, 100, s.y, DUNE.gold, 0.4); }
    }
  },

  drawLedge(g, o) { // striped canvas awning
    g.fillStyle(DUNE.shade, 1).fillRect(o.x, o.y, o.w, 7);
    for (let xx = o.x, i = 0; xx < o.x + o.w; xx += 24, i++) {
      g.fillStyle(i % 2 ? 0xf2e6c4 : DUNE.red, 1).fillTriangle(xx, o.y + 7, xx + 24, o.y + 7, xx + 12, o.y + 24);
    }
    g.fillStyle(0xffffff, 0.2).fillRect(o.x, o.y, o.w, 2);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'palace': {
        sandBlocks(g, d.x, d.y, d.w, d.h, 0xb98b52, d.seed);
        g.fillStyle(DUNE.turq, 1).fillEllipse(d.x + d.w / 2, d.y, d.w * 0.7, d.w * 0.7).fillStyle(DUNE.gold, 1).fillRect(d.x + d.w / 2 - 3, d.y - d.w * 0.35 - 22, 6, 24).fillCircle(d.x + d.w / 2, d.y - d.w * 0.35 - 24, 6);
        g.fillStyle(0x10090a, 1); for (let xx = d.x + 30; xx < d.x + d.w - 40; xx += 70) g.fillRect(xx, d.y + 50, 28, 62).fillEllipse(xx + 14, d.y + 50, 28, 28);
        crenels(g, d.x, d.y, d.w, 0xb98b52);
        break;
      }
      case 'minaret': {
        sandBlocks(g, d.x, d.y, d.w, d.h, 0xb98b52, d.seed);
        g.fillStyle(DUNE.gold, 1).fillTriangle(d.x - 8, d.y, d.x + d.w + 8, d.y, d.x + d.w / 2, d.y - 70).fillRect(d.x - 8, d.y + 80, d.w + 16, 10);
        g.fillStyle(0x10090a, 1).fillEllipse(d.x + d.w / 2, d.y + 40, 18, 26);
        break;
      }
      case 'palm': {
        g.lineStyle(10, 0x5a3a1c, 1).beginPath().moveTo(d.x, d.y).lineTo(d.x + 18, d.y - d.h * 0.5).lineTo(d.x + 6, d.y - d.h).strokePath();
        for (let i = 0; i < 7; i++) { const a = -2.9 + i * 0.45; g.lineStyle(5, i % 2 ? 0x3e7a3a : 0x4f9446, 1).beginPath().moveTo(d.x + 6, d.y - d.h).lineTo(d.x + 6 + Math.cos(a) * 60, d.y - d.h - 36 + Math.sin(a) * 8).lineTo(d.x + 6 + Math.cos(a) * 100, d.y - d.h + 22 + Math.sin(a) * 28).strokePath(); }
        break;
      }
      case 'stall': { // bazaar stall with awning and goods
        g.fillStyle(0x6a4527, 1).fillRect(d.x, d.y + 30, d.w, d.h - 30).fillRect(d.x + 4, d.y, 6, d.h).fillRect(d.x + d.w - 10, d.y, 6, d.h);
        for (let xx = d.x, i = 0; xx < d.x + d.w; xx += 20, i++) g.fillStyle(i % 2 ? 0xf2e6c4 : DUNE.red, 1).fillTriangle(xx, d.y, xx + 20, d.y, xx + 10, d.y + 24);
        for (let i = 0; i < 4; i++) g.fillStyle([DUNE.turq, DUNE.gold, DUNE.red, 0xe8d29a][i], 1).fillCircle(d.x + 22 + i * 22, d.y + d.h - 8, 8);
        break;
      }
      case 'sphinx': {
        g.fillStyle(0xb98b52, 1).fillRect(d.x, d.y + d.h * 0.45, d.w, d.h * 0.55).fillRect(d.x + d.w * 0.02, d.y + d.h * 0.3, d.w * 0.3, d.h * 0.2);
        g.fillStyle(0xa77c46, 1).fillEllipse(d.x + d.w * 0.2, d.y + d.h * 0.18, d.w * 0.2, d.h * 0.36).fillStyle(DUNE.turq, 1).fillTriangle(d.x + d.w * 0.08, d.y + d.h * 0.1, d.x + d.w * 0.32, d.y + d.h * 0.1, d.x + d.w * 0.2, d.y - d.h * 0.02);
        g.fillStyle(0x10090a, 1).fillRect(d.x + d.w * 0.2, d.y + d.h * 0.14, d.w * 0.05, 5);
        break;
      }
      case 'pillar': {
        g.fillStyle(0xc49a5e, 1).fillRect(d.x, d.y, d.w, d.h).fillStyle(DUNE.stoneDark, 1).fillRect(d.x - 8, d.y - 14, d.w + 16, 16).fillRect(d.x - 8, d.y + d.h - 12, d.w + 16, 14);
        hiero(g, d.x, d.y + 30, d.w, d.h - 60, d.seed, DUNE.shade, 0.5);
        break;
      }
      case 'obelisk': {
        g.fillStyle(0xb98b52, 1).fillTriangle(d.x, d.y + d.h, d.x + d.w, d.y + d.h, d.x + d.w / 2, d.y).fillStyle(0x8a6034, 1).fillTriangle(d.x + d.w / 2, d.y, d.x + d.w, d.y + d.h, d.x + d.w / 2, d.y + d.h);
        g.fillStyle(DUNE.gold, 1).fillTriangle(d.x + d.w * 0.4, d.y + 20, d.x + d.w * 0.6, d.y + 20, d.x + d.w / 2, d.y);
        break;
      }
      case 'tomb_back': { // underground: dark rock and carved walls
        g.fillStyle(0x1d1109, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x2c1b0f, 1).fillRect(d.x, d.y + d.h - 80, d.w, 80);
        for (let xx = d.x + 40; xx < d.x + d.w - 100; xx += 220) { hiero(g, xx, d.y + 30, 160, 60, d.seed + xx, DUNE.gold, 0.55); g.fillStyle(0x3a2412, 1).fillRect(xx + 70, d.y + 100, 24, d.h - 180); }
        break;
      }
      case 'jar': g.fillStyle(0x9a4a2c, 1).fillEllipse(d.x, d.y - d.h * 0.4, d.w, d.h * 0.8).fillRect(d.x - d.w * 0.25, d.y - d.h, d.w * 0.5, d.h * 0.3).fillStyle(DUNE.gold, 1).fillRect(d.x - d.w * 0.4, d.y - d.h * 0.5, d.w * 0.8, 4); break;
      case 'cactus': g.fillStyle(0x4f8a45, 1).fillRect(d.x - 6, d.y - d.h, 12, d.h).fillRect(d.x - 20, d.y - d.h * 0.6, 8, d.h * 0.3).fillRect(d.x - 20, d.y - d.h * 0.4, 14, 6).fillRect(d.x + 12, d.y - d.h * 0.7, 8, d.h * 0.3).fillRect(d.x + 6, d.y - d.h * 0.5, 14, 6); break;
      case 'brazier': g.fillStyle(0x3a2a18, 1).fillRect(d.x - 18, d.y - d.h, 36, 12).fillTriangle(d.x - 14, d.y - d.h + 12, d.x + 14, d.y - d.h + 12, d.x, d.y).fillRect(d.x - 20, d.y - 8, 40, 8); break;
      case 'banner': g.fillStyle(0x3a2a18, 1).fillRect(d.x + d.w / 2 - 2, d.y, 4, d.h + 40); break;
      case 'sign': {
        g.fillStyle(0x6a4527, 1).fillRect(d.x + 10, d.y + d.h, 7, 60).fillRect(d.x + d.w - 17, d.y + d.h, 7, 60);
        g.fillStyle(0xe8d29a, 1).fillRect(d.x, d.y, d.w, d.h).lineStyle(3, DUNE.red, 1).strokeRect(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
        ctx.text(d, 0x5b2a14);
        break;
      }
      case 'door': {
        g.fillStyle(0x10090a, 1).fillRect(d.x, d.y, d.w, d.h).fillStyle(DUNE.gold, 1).fillRect(d.x - 10, d.y - 14, d.w + 20, 16).fillRect(d.x - 10, d.y, 10, d.h).fillRect(d.x + d.w, d.y, 10, d.h);
        g.fillStyle(DUNE.turq, 0.2).fillRect(d.x, d.y, d.w, d.h);
        hiero(g, d.x - 10, d.y - 14, d.w + 20, 16, d.seed, DUNE.shade, 0.9);
        if (d.text) ctx.text({ ...d, y: d.y - 40, h: 24 }, 0xf2d27a);
        break;
      }
      default: break;
    }
  },

  animated: {
    banner: {
      layer: 'back', pad: 90,
      draw(g, d, t) {
        const x0 = d.x + d.w / 2 + 2;
        g.fillStyle(DUNE.red, 1).beginPath().moveTo(x0, d.y + 4);
        for (let i = 0; i <= 8; i++) g.lineTo(x0 + i * 9, d.y + 4 + Math.sin(t * 4 + i * 0.7) * (1.5 + i * 0.6));
        for (let i = 8; i >= 0; i--) g.lineTo(x0 + i * 9, d.y + 50 + Math.sin(t * 4 + i * 0.7) * (1.5 + i * 0.6));
        g.closePath().fillPath().fillStyle(DUNE.gold, 1).fillCircle(x0 + 24, d.y + 28 + Math.sin(t * 4 + 2) * 3, 7);
      },
    },
    brazier: {
      layer: 'back', pad: 100,
      draw(g, d, t) {
        const fl = 0.8 + 0.2 * Math.sin(t * 12 + d.seed);
        g.fillStyle(0xffa64a, 0.15 * fl).fillCircle(d.x, d.y - d.h - 10, 90);
        g.fillStyle(0xff7a1a, 0.95).fillTriangle(d.x - 14, d.y - d.h, d.x + 14, d.y - d.h, d.x + Math.sin(t * 8 + d.seed) * 4, d.y - d.h - 40 * fl);
        g.fillStyle(0xffe08a, 1).fillTriangle(d.x - 5, d.y - d.h, d.x + 5, d.y - d.h, d.x, d.y - d.h - 18 * fl);
      },
    },
    sandfall: {
      layer: 'back', pad: 60,
      draw(g, d, t) {
        g.fillStyle(0xe8c47a, 0.7).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0xfff0c0, 0.5); for (let i = 0; i < 10; i++) { const u = (t * 0.8 + hash(d.seed + i)) % 1; g.fillRect(d.x + hash(d.seed + i * 3) * (d.w - 3), d.y + u * (d.h - 18), 3, 18); }
        g.fillStyle(0xe8c47a, 0.9).fillEllipse(d.x + d.w / 2, d.y + d.h, d.w * 2.4, 22);
      },
    },
    tomb_back: {
      layer: 'back', pad: 100,
      draw(g, d, t) { for (let xx = d.x + 100; xx < d.x + d.w - 60; xx += 320) { const k = 0.75 + 0.25 * Math.sin(t * 10 + xx); g.fillStyle(0xffa64a, 0.1 * k).fillCircle(xx, d.y + 150, 100); g.fillStyle(0xff8a2a, 0.9).fillTriangle(xx - 6, d.y + 150, xx + 6, d.y + 150, xx, d.y + 120 * 0.2 + 126 * k * 0.9 - 40); } },
    },
    windband: {
      layer: 'front', pad: 20,
      draw(g, d, t) { g.fillStyle(0xf2d79a, 0.28); for (let i = 0; i < 26; i++) { const x = d.x + ((hash(d.seed + i) * d.w - t * 620) % d.w + d.w) % d.w; g.fillRect(x, GROUND_Y - 20 - hash(i + d.seed * 3) * 260, 46, 2); } },
    },
  },

  ambient(scene): AmbientParticles {
    const g = scene.add.graphics().setDepth(67);
    return {
      update(_dt, view, t) { // wind-blown sand
        g.clear();
        g.fillStyle(0xf2d79a, 0.5);
        for (let i = 0; i < 70; i++) {
          const px = view.left + ((hash(i * 3) * view.width * 1.2 - t * (120 + hash(i) * 120)) % (view.width * 1.2) + view.width * 1.2) % (view.width * 1.2);
          const py = view.top + view.height * (0.2 + 0.8 * hash(i + 11)) + Math.sin(t + i) * 6;
          g.fillRect(px, py, 2 + hash(i + 5) * 6, 1.5);
        }
        g.fillStyle(0xf2b36a, 0.04).fillRect(view.left, view.top, view.width, view.height);
      },
    };
  },
};
