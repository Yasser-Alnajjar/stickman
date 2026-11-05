import Phaser from 'phaser';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, hash, mulberry32, vgrad, wrapX } from '../../kit';

type Ctx = CanvasRenderingContext2D;
type G = Phaser.GameObjects.Graphics;

export const JADE = {
  stone: 0x6f7d66, stoneDark: 0x3a463d, stoneLight: 0x93a38a, moss: 0x4c8a47, mossLight: 0x86c35d,
  gold: 0xe6b94f, glow: 0x7dffd0, wood: 0x5a3d26, ink: 0x0d1a17,
} as const;

/* ------------------------------------------------------------------ backdrop (canvas) */

function farRuins(c: Ctx, w: number, h: number): void {
  const r = mulberry32(404);
  vgrad(c, 0, 0, w, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']]);
  // misty jungle mountains
  for (let layer = 0; layer < 3; layer++) {
    c.fillStyle = ['#1c4a45', '#173f3b', '#123431'][layer];
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 64) c.lineTo(x, h - 150 - layer * 40 - Math.abs(Math.sin(x * 0.004 + layer * 2)) * (140 - layer * 20) - r() * 30);
    c.lineTo(w, h); c.closePath(); c.fill();
  }
  // stepped pyramids on the ridge, their summits lit
  for (const px of [260, 900, 1560]) {
    const base = h - 190, pw = 300, steps = 6;
    for (let i = 0; i < steps; i++) {
      const sw = pw * (1 - i / steps), sx = px - sw / 2, sy = base - i * 30;
      c.fillStyle = i % 2 ? '#26413a' : '#2c4a42'; wrapX(w, sx, sw, (x) => c.fillRect(x, sy, sw, 30));
    }
    c.fillStyle = 'rgba(125,255,208,0.9)'; wrapX(w, px - 14, 28, (x) => c.fillRect(x, base - steps * 30 - 10, 28, 12));
    const g = c.createRadialGradient(px, base - steps * 30, 0, px, base - steps * 30, 120);
    g.addColorStop(0, 'rgba(125,255,208,0.35)'); g.addColorStop(1, 'rgba(125,255,208,0)');
    c.fillStyle = g; c.fillRect(px - 120, base - steps * 30 - 120, 240, 240);
  }
  vgrad(c, 0, h - 120, w, 120, [[0, 'rgba(160,210,190,0)'], [1, 'rgba(160,210,190,0.35)']]);
}

function midCanopy(c: Ctx, w: number, h: number): void {
  const r = mulberry32(717);
  // ruined arches and broken columns standing in the trees
  for (let x = 60; x < w; x += 300 + r() * 220) {
    const kind = r();
    c.fillStyle = '#12302b';
    if (kind < 0.45) { // arch
      const aw = 180, ah = 190 + r() * 80;
      wrapX(w, x, aw + 40, (ox) => {
        c.fillRect(ox, h - ah, 36, ah); c.fillRect(ox + aw, h - ah + 30, 36, ah - 30);
        c.beginPath(); c.moveTo(ox, h - ah); c.quadraticCurveTo(ox + aw / 2 + 10, h - ah - 90, ox + aw + 36, h - ah + 30); c.lineTo(ox + aw + 36, h - ah + 62); c.quadraticCurveTo(ox + aw / 2 + 10, h - ah - 46, ox + 36, h - ah + 32); c.fill();
      });
    } else if (kind < 0.8) { // snapped column
      const ch = 120 + r() * 160;
      wrapX(w, x, 50, (ox) => { c.fillRect(ox, h - ch, 40, ch); c.fillRect(ox - 6, h - ch - 12, 52, 14); c.fillRect(ox - 6, h - 14, 52, 14); });
    } else { // idol head silhouette
      wrapX(w, x, 100, (ox) => { c.fillRect(ox, h - 170, 90, 170); c.fillStyle = 'rgba(125,255,208,0.7)'; c.fillRect(ox + 18, h - 120, 18, 8); c.fillRect(ox + 54, h - 120, 18, 8); c.fillStyle = '#12302b'; });
    }
  }
  // canopy: layered leaf clusters
  for (let i = 0; i < 70; i++) {
    const cx = r() * w, cy = h - 220 - r() * 160, rad = 50 + r() * 70;
    c.fillStyle = `rgba(${28 + r() * 20},${86 + r() * 40},${58 + r() * 20},0.95)`;
    wrapX(w, cx - rad, rad * 2, (ox) => { c.beginPath(); c.arc(ox + rad, cy, rad, 0, 7); c.fill(); });
  }
  vgrad(c, 0, h - 60, w, 60, [[0, 'rgba(10,30,26,0)'], [1, 'rgba(10,30,26,0.6)']]);
}

function nearTrunks(c: Ctx, w: number, h: number): void {
  const r = mulberry32(88);
  for (let x = 80; x < w; x += 520 + r() * 360) {
    const tw = 54 + r() * 40;
    c.fillStyle = '#06130f';
    wrapX(w, x - 40, tw + 120, (ox) => {
      c.fillRect(ox, 0, tw, h);
      c.beginPath(); c.moveTo(ox - 40, h); c.quadraticCurveTo(ox + 4, h - 90, ox, h - 150); c.lineTo(ox + tw, h - 150); c.quadraticCurveTo(ox + tw - 4, h - 90, ox + tw + 40, h); c.fill();
      c.strokeStyle = '#06130f'; c.lineWidth = 3;
      for (let k = 0; k < 3; k++) { const vx = ox + 8 + k * 16, vl = 140 + r() * 260; c.beginPath(); c.moveTo(vx, 40); c.bezierCurveTo(vx + 20, 40 + vl * 0.4, vx - 16, 40 + vl * 0.7, vx + 6, 40 + vl); c.stroke(); }
    });
  }
}

const art: BackdropArt = {
  sky: [[0, '#0a2a30'], [0.42, '#1d5a52'], [0.78, '#86ab6a'], [1, '#e2d58c']],
  far: { w: 2048, h: 520, draw: farRuins },
  mid: { w: 2048, h: 420, draw: midCanopy },
  near: { w: 2048, h: 640, draw: nearTrunks },
};

function backdropFx(g: G, f: BackdropFrame): void {
  const { w, h, zoom, t } = f;
  g.clear();
  // sun shafts breaking through the canopy
  for (let i = 0; i < 5; i++) {
    const sx = ((hash(i * 3) * w * 1.3 + f.midX * -0.05 * zoom) % w + w) % w;
    const sway = Math.sin(t * 0.3 + i) * 20 * zoom;
    g.fillStyle(0xfff3b0, 0.05 + 0.02 * Math.sin(t * 0.7 + i));
    g.fillTriangle(sx, 0, sx + 60 * zoom + sway, 0, sx - 120 * zoom + sway, h * 0.9).fillTriangle(sx, 0, sx + 60 * zoom + sway, 0, sx + 240 * zoom + sway, h * 0.9);
  }
  // parrots crossing the gap
  for (let i = 0; i < 3; i++) {
    const px = ((hash(i + 50) * w + t * (50 + i * 14) * zoom) % (w + 200 * zoom)) - 100 * zoom, py = h * (0.15 + 0.1 * hash(i)) + Math.sin(t * 2 + i) * 10 * zoom;
    const flap = Math.sin(t * 9 + i) * 5 * zoom;
    g.fillStyle([0xe5484d, 0x4dd0a0, 0xf5c542][i], 0.95).fillTriangle(px - 8 * zoom, py - flap, px + 8 * zoom, py - flap, px, py + 3 * zoom);
    g.fillStyle(0x0b1a16, 0.9).fillCircle(px + 8 * zoom, py, 2.4 * zoom);
  }
  // warm mist banks
  for (let i = 0; i < 4; i++) {
    const mx = ((hash(i + 20) * w + t * (5 + i * 2) * zoom) % (w + 800 * zoom)) - 400 * zoom;
    g.fillStyle(0xcfeadb, 0.07).fillEllipse(mx, f.sy(0.1, 0.88, 90 + i * 24), 760 * zoom, 50 * zoom);
  }
}

/* ------------------------------------------------------------------ structure helpers */

function glyphs(g: G, x: number, y: number, w: number, h: number, seed: number, col: number, a = 0.5): void {
  g.lineStyle(2, col, a);
  const n = Math.max(1, Math.floor(w / 34));
  for (let i = 0; i < n; i++) {
    const gx = x + 14 + i * 34, gy = y + h / 2, k = Math.floor(hash(seed + i) * 4);
    if (gx + 20 > x + w) break;
    if (k === 0) g.strokeCircle(gx + 8, gy, 6).lineBetween(gx + 8, gy - 10, gx + 8, gy + 10);
    else if (k === 1) { g.lineBetween(gx, gy - 8, gx + 16, gy - 8).lineBetween(gx + 16, gy - 8, gx + 16, gy + 8).lineBetween(gx, gy + 8, gx + 16, gy + 8); }
    else if (k === 2) g.lineBetween(gx, gy + 8, gx + 8, gy - 9).lineBetween(gx + 8, gy - 9, gx + 16, gy + 8).lineBetween(gx + 3, gy + 1, gx + 13, gy + 1);
    else g.strokeRect(gx, gy - 7, 14, 14).lineBetween(gx + 7, gy - 7, gx + 7, gy + 7);
  }
}

function blocks(g: G, x: number, y: number, w: number, h: number, seed: number, base: number): void {
  g.fillStyle(base, 1).fillRect(x, y, w, h);
  g.lineStyle(2, JADE.ink, 0.45);
  const rh = 26;
  for (let row = 0, yy = y; yy < y + h; row++, yy += rh) {
    g.lineBetween(x, yy, x + w, yy);
    const off = (row % 2) * 36;
    for (let xx = x + 70 - off; xx < x + w; xx += 72) g.lineBetween(xx, yy, xx, Math.min(y + h, yy + rh));
  }
  for (let i = 0; i < Math.ceil(w / 90); i++) { // moss patches creeping down
    const mx = x + hash(seed + i) * w;
    g.fillStyle(JADE.moss, 0.55).fillEllipse(mx, y + 4, 56 + hash(seed + i + 9) * 40, 18);
  }
}

function mossTop(g: G, x: number, y: number, w: number, seed: number): void {
  g.fillStyle(JADE.moss, 1).fillRect(x, y, w, 7);
  g.fillStyle(JADE.mossLight, 1);
  for (let xx = x; xx < x + w; xx += 22) g.fillCircle(xx + 6 + hash(seed + xx) * 8, y + 2, 4 + hash(seed + xx + 1) * 3);
  g.fillStyle(JADE.moss, 0.9);
  for (let xx = x + 8; xx < x + w; xx += 38) { const l = 6 + hash(seed + xx * 2) * 16; g.fillRect(xx, y + 5, 3, l); }
}

/* ------------------------------------------------------------------ theme */

export const jadeTheme: WorldTheme = {
  id: 'jade',
  accent: JADE.mossLight,
  backdrop: art,
  backdropFx,

  drawSolid(g, s) {
    switch (s.kind) {
      case 'ground': {
        g.fillStyle(JADE.stoneDark, 1).fillRect(s.x, s.y, s.w, s.h);
        blocks(g, s.x, s.y + 8, s.w, s.h - 8, s.x, JADE.stone);
        mossTop(g, s.x, s.y, s.w, s.x);
        glyphs(g, s.x, s.y + 40, s.w, 40, s.x + 3, JADE.glow, 0.28);
        break;
      }
      case 'roof': {
        blocks(g, s.x, s.y, s.w, s.h, s.x, JADE.stoneLight);
        g.fillStyle(JADE.stoneDark, 1).fillRect(s.x - 6, s.y + s.h - 6, s.w + 12, 8);
        mossTop(g, s.x, s.y - 4, s.w, s.x + 5);
        glyphs(g, s.x, s.y, s.w, s.h, s.x, JADE.gold, 0.45);
        break;
      }
      case 'crate': {
        blocks(g, s.x, s.y, s.w, s.h, s.x, JADE.stone);
        g.lineStyle(3, JADE.stoneDark, 1).strokeRect(s.x, s.y, s.w, s.h);
        mossTop(g, s.x, s.y - 3, s.w, s.x);
        break;
      }
      case 'gate': { // sealed jade door
        g.fillStyle(0x2c4a3f, 1).fillRect(s.x, s.y, s.w, s.h);
        glyphs(g, s.x, s.y + 40, s.w, 90, s.x, JADE.glow, 0.9);
        g.lineStyle(4, JADE.gold, 1).strokeRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8);
        break;
      }
      default: { // wall: carved relief
        blocks(g, s.x, s.y, s.w, s.h, s.x, JADE.stoneDark);
        glyphs(g, s.x, s.y + 80, s.w, 120, s.y, JADE.gold, 0.4);
      }
    }
  },

  drawLedge(g, o) { // rope-and-plank bridge
    g.fillStyle(JADE.wood, 1).fillRect(o.x, o.y, o.w, 11);
    g.lineStyle(2, 0x1d120a, 0.8);
    for (let x = o.x + 14; x < o.x + o.w; x += 22) g.lineBetween(x, o.y, x, o.y + 11);
    g.fillStyle(JADE.mossLight, 0.9).fillRect(o.x, o.y - 2, o.w, 3);
    g.lineStyle(2, 0xb59867, 1).lineBetween(o.x, o.y + 12, o.x + o.w / 2, o.y + 22).lineBetween(o.x + o.w / 2, o.y + 22, o.x + o.w, o.y + 12);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'pyramid': { // big stepped temple in the background of the city
        const steps = 8, sw = d.w / steps;
        for (let i = 0; i < steps; i++) {
          const w = d.w - i * sw * 1.0, x = d.x + (d.w - w) / 2, h = d.h / steps;
          g.fillStyle(i % 2 ? 0x2f4a40 : 0x37564a, 1).fillRect(x, d.y + d.h - (i + 1) * h, w, h + 1);
          glyphs(g, x, d.y + d.h - (i + 1) * h, w, h, d.seed + i, JADE.glow, 0.18);
        }
        g.fillStyle(0x22382f, 1).fillRect(d.x + d.w / 2 - 30, d.y + d.h - 70, 60, 70);
        break;
      }
      case 'idol': { // colossal carved head
        g.fillStyle(0x3c5246, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x2f4439, 1).fillRect(d.x - 10, d.y - 12, d.w + 20, 22).fillRect(d.x + d.w * 0.35, d.y + d.h * 0.45, d.w * 0.3, d.h * 0.12);
        g.fillStyle(0x24352c, 1).fillRect(d.x + d.w * 0.12, d.y + d.h * 0.7, d.w * 0.76, d.h * 0.14);
        g.fillStyle(0x0b1a16, 1).fillRect(d.x + d.w * 0.18, d.y + d.h * 0.25, d.w * 0.2, d.h * 0.1).fillRect(d.x + d.w * 0.62, d.y + d.h * 0.25, d.w * 0.2, d.h * 0.1);
        break;
      }
      case 'arch': {
        g.fillStyle(0x3c5246, 1).fillRect(d.x, d.y, 40, d.h).fillRect(d.x + d.w - 40, d.y, 40, d.h);
        g.fillStyle(0x3c5246, 1).fillRect(d.x - 12, d.y - 22, d.w + 24, 34);
        glyphs(g, d.x - 12, d.y - 22, d.w + 24, 34, d.seed, JADE.gold, 0.5);
        g.fillStyle(JADE.moss, 0.8).fillEllipse(d.x + d.w * 0.3, d.y - 20, 80, 16);
        break;
      }
      case 'column': {
        g.fillStyle(0x4a6154, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x34463b, 1).fillRect(d.x - 8, d.y - 12, d.w + 16, 14).fillRect(d.x - 8, d.y + d.h - 12, d.w + 16, 14);
        g.lineStyle(2, JADE.ink, 0.35);
        for (let x = d.x + 10; x < d.x + d.w; x += 14) g.lineBetween(x, d.y, x, d.y + d.h);
        break;
      }
      case 'obelisk': {
        g.fillStyle(0x2b3d34, 1).fillTriangle(d.x, d.y + d.h, d.x + d.w, d.y + d.h, d.x + d.w / 2, d.y);
        g.fillStyle(0x3a5145, 1).fillTriangle(d.x + d.w / 2, d.y, d.x + d.w, d.y + d.h, d.x + d.w / 2, d.y + d.h);
        g.fillStyle(JADE.glow, 0.7).fillCircle(d.x + d.w / 2, d.y + d.h * 0.35, 6);
        break;
      }
      case 'tree': { // jungle tree with a hanging canopy
        g.fillStyle(0x2c1f14, 1).fillRect(d.x + d.w / 2 - 14, d.y + 60, 28, d.h - 60);
        g.fillTriangle(d.x + d.w / 2 - 14, d.y + d.h, d.x + d.w / 2 - 50, d.y + d.h, d.x + d.w / 2 - 12, d.y + d.h - 60).fillTriangle(d.x + d.w / 2 + 14, d.y + d.h, d.x + d.w / 2 + 50, d.y + d.h, d.x + d.w / 2 + 12, d.y + d.h - 60);
        for (let i = 0; i < 6; i++) g.fillStyle(i % 2 ? 0x2f6b3c : 0x3f8a48, 1).fillCircle(d.x + d.w / 2 + (hash(d.seed + i) - 0.5) * d.w, d.y + 40 + hash(d.seed + i + 5) * 40, 50 + hash(d.seed + i + 9) * 30);
        break;
      }
      case 'fern': {
        g.lineStyle(3, 0x3f8a48, 1);
        for (let i = -3; i <= 3; i++) g.lineBetween(d.x, d.y, d.x + i * 12, d.y - d.h + Math.abs(i) * 6);
        break;
      }
      case 'torch': g.fillStyle(0x3a2a1c, 1).fillRect(d.x - 3, d.y - d.h, 6, d.h).fillRect(d.x - 10, d.y - d.h - 6, 20, 8); break;
      case 'brazier': g.fillStyle(0x30402f, 1).fillRect(d.x - 18, d.y - d.h, 36, 14).fillTriangle(d.x - 14, d.y - d.h + 14, d.x + 14, d.y - d.h + 14, d.x, d.y).fillRect(d.x - 20, d.y - 8, 40, 8); break;
      case 'waterfall': g.fillStyle(0x26382f, 1).fillRect(d.x - 20, d.y, d.w + 40, 30).fillRect(d.x - 20, d.y + d.h - 24, d.w + 40, 24); break;
      case 'vines': { // hanging over the actors
        g.lineStyle(3, 0x2c6e3a, 0.95);
        for (let i = 0; i < 4; i++) { const vx = d.x + i * 20; g.beginPath().moveTo(vx, d.y).lineTo(vx + (hash(d.seed + i) - 0.5) * 24, d.y + d.h * 0.5).lineTo(vx + (hash(d.seed + i + 4) - 0.5) * 20, d.y + d.h).strokePath(); g.fillStyle(0x4fa05a, 1).fillCircle(vx + (hash(d.seed + i + 4) - 0.5) * 20, d.y + d.h, 5); }
        break;
      }
      case 'sign': { // carved tablet
        g.fillStyle(0x3c5246, 1).fillRect(d.x + 10, d.y + d.h, 8, 60).fillRect(d.x + d.w - 18, d.y + d.h, 8, 60);
        g.fillStyle(0x2a3b32, 1).fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(2, JADE.gold, 0.8).strokeRect(d.x + 4, d.y + 4, d.w - 8, d.h - 8);
        ctx.text(d, 0xe9d9a0);
        break;
      }
      case 'door': { // temple portal
        g.fillStyle(0x0c1713, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x3c5246, 1).fillRect(d.x - 12, d.y - 14, d.w + 24, 18).fillRect(d.x - 12, d.y, 12, d.h).fillRect(d.x + d.w, d.y, 12, d.h);
        g.fillStyle(JADE.glow, 0.14).fillRect(d.x, d.y, d.w, d.h);
        glyphs(g, d.x - 12, d.y - 14, d.w + 24, 18, d.seed, JADE.gold, 0.8);
        if (d.text) ctx.text({ ...d, y: d.y - 40, h: 24 }, 0xe9d9a0);
        break;
      }
      default: break;
    }
  },

  animated: {
    torch: {
      layer: 'back', pad: 90,
      draw(g, d, t) {
        const fl = 0.8 + 0.2 * Math.sin(t * 13 + d.seed);
        g.fillStyle(0xffb347, 0.14 * fl).fillCircle(d.x, d.y - d.h - 6, 70);
        g.fillStyle(0xff7a1a, 0.95).fillTriangle(d.x - 7, d.y - d.h - 4, d.x + 7, d.y - d.h - 4, d.x + Math.sin(t * 9 + d.seed) * 3, d.y - d.h - 30 * fl);
        g.fillStyle(0xffe08a, 1).fillTriangle(d.x - 3, d.y - d.h - 4, d.x + 3, d.y - d.h - 4, d.x, d.y - d.h - 16 * fl);
      },
    },
    brazier: {
      layer: 'back', pad: 100,
      draw(g, d, t) {
        const fl = 0.8 + 0.2 * Math.sin(t * 11 + d.seed);
        g.fillStyle(JADE.glow, 0.12 * fl).fillCircle(d.x, d.y - d.h - 10, 90);
        g.fillStyle(0x3fe0b0, 0.95).fillTriangle(d.x - 14, d.y - d.h, d.x + 14, d.y - d.h, d.x + Math.sin(t * 7 + d.seed) * 4, d.y - d.h - 44 * fl);
        g.fillStyle(0xd8fff0, 1).fillTriangle(d.x - 5, d.y - d.h, d.x + 5, d.y - d.h, d.x, d.y - d.h - 20 * fl);
      },
    },
    waterfall: {
      layer: 'back', pad: 60,
      draw(g, d, t) {
        g.fillStyle(0x9fe6e0, 0.55).fillRect(d.x, d.y + 28, d.w, d.h - 52);
        g.fillStyle(0xffffff, 0.35);
        for (let i = 0; i < 9; i++) { const u = (t * 0.9 + hash(d.seed + i)) % 1; g.fillRect(d.x + hash(d.seed + i * 3) * (d.w - 4), d.y + 28 + u * (d.h - 60), 3, 22); }
        g.fillStyle(0xffffff, 0.45).fillEllipse(d.x + d.w / 2, d.y + d.h - 22, d.w * 1.7, 18);
      },
    },
    idol: {
      layer: 'back', pad: 40,
      draw(g, d, t) { // eyes smoulder
        const k = 0.5 + 0.5 * Math.sin(t * 1.6 + d.seed);
        g.fillStyle(JADE.glow, 0.35 + 0.5 * k).fillRect(d.x + d.w * 0.18, d.y + d.h * 0.25, d.w * 0.2, d.h * 0.1).fillRect(d.x + d.w * 0.62, d.y + d.h * 0.25, d.w * 0.2, d.h * 0.1);
        g.fillStyle(JADE.glow, 0.08 * k).fillCircle(d.x + d.w * 0.28, d.y + d.h * 0.3, 50).fillCircle(d.x + d.w * 0.72, d.y + d.h * 0.3, 50);
      },
    },
    obelisk: {
      layer: 'back', pad: 50,
      draw(g, d, t) { g.fillStyle(JADE.glow, 0.08 + 0.08 * Math.sin(t * 2 + d.seed)).fillCircle(d.x + d.w / 2, d.y + d.h * 0.35, 40); },
    },
  },

  ambient(scene): AmbientParticles {
    const g = scene.add.graphics().setDepth(67);
    return {
      update(_dt, view, t) { // falling leaves and fireflies
        g.clear();
        for (let i = 0; i < 16; i++) {
          const u = (t * 0.12 + hash(i)) % 1;
          const px = view.left + ((hash(i * 5) * view.width + Math.sin(t * 0.8 + i) * 50 + t * 12) % view.width);
          g.fillStyle(0x7bbf5a, 0.65).fillEllipse(px, view.top + u * view.height, 8, 4);
        }
        for (let i = 0; i < 14; i++) {
          const px = view.left + hash(i + 77) * view.width + Math.sin(t * 0.7 + i) * 30, py = view.top + view.height * (0.45 + 0.5 * hash(i + 3)) + Math.cos(t * 0.9 + i * 2) * 18;
          const on = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2 + i * 1.7));
          g.fillStyle(0xd9ff7a, 0.18 * on).fillCircle(px, py, 9).fillStyle(0xf4ffb0, on).fillCircle(px, py, 2);
        }
      },
    };
  },
};
