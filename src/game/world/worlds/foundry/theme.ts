import Phaser from 'phaser';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, glow, hash, mulberry32, vgrad, wrapX } from '../../kit';

/**
 * EMBER FOUNDRY: a fortress-smelter built into an active volcano. Basalt causeway over molten lava, brick forges with
 * roaring furnaces, chimneys, spinning gears, pistons, ladles on rails, chained iron grating and constant embers.
 */

export const EMBER = {
  fire: 0xff6a1a, hot: 0xffc43a, red: 0x8a1a10, iron: 0x2b2523, iron2: 0x3a312d, basalt: 0x16100f, basalt2: 0x241a18, brick: 0x3a1f1a,
} as const;

export const heat = { erupt: -99 };

type Ctx = CanvasRenderingContext2D;

/* ------------------------------------------------------------------ backdrop art */

function farVolcano(c: Ctx, w: number, h: number): void {
  const hy = h - 150;
  // ridge line
  const r = mulberry32(14);
  c.fillStyle = '#1a0a0a';
  c.beginPath(); c.moveTo(0, h);
  let y = hy - 40;
  for (let x = 0; x <= w; x += 32) { y += (r() - 0.5) * 36; y = Math.max(hy - 130, Math.min(hy + 10, y)); c.lineTo(x, y); }
  c.lineTo(w, h); c.closePath(); c.fill();
  // the volcano, glowing crater and lava runs
  const vx = 1000;
  c.fillStyle = '#120707';
  c.beginPath(); c.moveTo(vx - 380, h); c.lineTo(vx - 70, hy - 250); c.lineTo(vx + 70, hy - 250); c.lineTo(vx + 380, h); c.closePath(); c.fill();
  const cg = c.createRadialGradient(vx, hy - 250, 0, vx, hy - 250, 160);
  cg.addColorStop(0, 'rgba(255,200,80,0.95)'); cg.addColorStop(0.35, 'rgba(255,100,20,0.5)'); cg.addColorStop(1, 'rgba(255,60,10,0)');
  c.fillStyle = cg; c.fillRect(vx - 200, hy - 450, 400, 400);
  c.strokeStyle = 'rgba(255,140,40,0.8)'; c.lineWidth = 4;
  for (const dx of [-30, 6, 40]) { c.beginPath(); c.moveTo(vx + dx, hy - 246); for (let i = 1; i <= 9; i++) c.lineTo(vx + dx * (1 + i * 0.55) + (r() - 0.5) * 24, hy - 246 + i * ((h - hy + 250) / 9)); c.stroke(); }
  // distant citadel with lit slits
  for (const [fx, fw] of [[120, 260], [1500, 340]] as [number, number][]) {
    c.fillStyle = '#0d0707'; c.fillRect(fx, hy - 90, fw, 100);
    for (let tx = fx; tx < fx + fw; tx += 60) { c.fillRect(tx, hy - 150 - r() * 50, 22, 70); c.beginPath(); c.moveTo(tx - 4, hy - 150); c.lineTo(tx + 11, hy - 190 - r() * 24); c.lineTo(tx + 26, hy - 150); c.fill(); }
    c.fillStyle = 'rgba(255,150,50,0.8)'; for (let tx = fx + 10; tx < fx + fw; tx += 20) if (r() < 0.6) c.fillRect(tx, hy - 60 - r() * 20, 3, 8);
  }
  // lava river in the foreground haze
  vgrad(c, 0, hy + 20, w, h - hy - 20, [[0, 'rgba(255,90,20,0)'], [1, 'rgba(255,90,20,0.45)']]);
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,${150 + r() * 80},60,${0.2 + r() * 0.4})`; c.fillRect(r() * w, hy + 30 + r() * 110, 20 + r() * 80, 2); }
}

function gear(c: Ctx, x: number, y: number, R: number, teeth: number): void {
  c.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const a = (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? R : R * 1.14; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill();
}

function midFortress(c: Ctx, w: number, h: number): void {
  const r = mulberry32(90);
  c.fillStyle = '#150b0a';
  for (let x = 0; x < w; ) {
    const k = r();
    if (k < 0.3) { // chimney with glowing lip
      const cw = 36 + r() * 18, ch = 190 + r() * 150;
      const draw = (ox: number): void => {
        c.fillStyle = '#150b0a'; c.beginPath(); c.moveTo(ox, h); c.lineTo(ox + 6, h - ch); c.lineTo(ox + cw - 6, h - ch); c.lineTo(ox + cw, h); c.fill();
        c.fillStyle = 'rgba(255,110,30,0.85)'; c.fillRect(ox + 4, h - ch - 2, cw - 8, 4);
        c.fillStyle = 'rgba(255,110,30,0.25)'; for (let by = h - ch + 40; by < h - 20; by += 46) c.fillRect(ox + 4, by, cw - 8, 3);
      };
      wrapX(w, x, cw, draw); x += cw + 30 + r() * 90;
    } else if (k < 0.6) { // crenellated wall with slits and a tower
      const ww = 180 + r() * 220, wh = 110 + r() * 80;
      const draw = (ox: number): void => {
        c.fillStyle = '#1a0d0b'; c.fillRect(ox, h - wh, ww, wh);
        for (let cx = ox; cx < ox + ww; cx += 24) c.fillRect(cx, h - wh - 14, 14, 14);
        c.fillRect(ox + ww - 46, h - wh - 90, 46, 90 + wh);
        c.beginPath(); c.moveTo(ox + ww - 52, h - wh - 90); c.lineTo(ox + ww - 23, h - wh - 130); c.lineTo(ox + ww + 6, h - wh - 90); c.fill();
        c.fillStyle = 'rgba(255,150,50,0.85)'; for (let sx = ox + 14; sx < ox + ww - 60; sx += 34) c.fillRect(sx, h - wh + 24, 4, 16);
        c.fillRect(ox + ww - 28, h - wh - 70, 4, 14);
      };
      wrapX(w, x, ww, draw); x += ww + 40 + r() * 120;
    } else if (k < 0.8) { // giant gear half-sunk behind the wall
      const R = 70 + r() * 50;
      const draw = (ox: number): void => { c.fillStyle = '#1b0e0c'; gear(c, ox + R, h - R * 0.25, R, 14); c.fillStyle = '#0d0707'; c.beginPath(); c.arc(ox + R, h - R * 0.25, R * 0.3, 0, 7); c.fill(); };
      wrapX(w, x, R * 2.3, draw); x += R * 2.3 + 40 + r() * 100;
    } else { // cooling tower
      const tw = 120 + r() * 40, th = 190 + r() * 60;
      const draw = (ox: number): void => { c.fillStyle = '#170c0a'; c.beginPath(); c.moveTo(ox, h); c.quadraticCurveTo(ox + tw * 0.28, h - th * 0.5, ox + tw * 0.2, h - th); c.lineTo(ox + tw * 0.8, h - th); c.quadraticCurveTo(ox + tw * 0.72, h - th * 0.5, ox + tw, h); c.fill(); c.fillStyle = 'rgba(255,90,20,0.4)'; c.fillRect(ox + tw * 0.2, h - th, tw * 0.6, 3); };
      wrapX(w, x, tw, draw); x += tw + 50 + r() * 100;
    }
  }
  // lavafall glow ribbons
  for (let x = 300; x < w; x += 700 + r() * 200) { const g = c.createLinearGradient(0, h - 260, 0, h); g.addColorStop(0, 'rgba(255,140,40,0.9)'); g.addColorStop(1, 'rgba(255,60,10,0.4)'); c.fillStyle = g; c.fillRect(x, h - 260, 8, 260); c.fillStyle = 'rgba(255,120,30,0.15)'; c.fillRect(x - 12, h - 260, 32, 260); }
  vgrad(c, 0, h - 90, w, 90, [[0, 'rgba(30,5,0,0)'], [1, 'rgba(255,70,10,0.28)']]);
}

function nearPipes(c: Ctx, w: number, h: number): void {
  const r = mulberry32(33);
  for (let x = 100; x < w; x += 400 + r() * 360) {
    const pw = 36 + r() * 30;
    c.fillStyle = '#080404'; c.fillRect(x, h - 560 - r() * 120, pw, 700);
    c.fillStyle = '#0d0605'; for (let y = h - 500; y < h; y += 90) c.fillRect(x - 6, y, pw + 12, 14);
    c.fillStyle = 'rgba(255,100,20,0.7)'; c.fillRect(x + pw - 5, h - 500, 3, 460);
    c.fillStyle = 'rgba(255,100,20,0.25)'; c.fillRect(x - 12, h - 320, pw + 24, 8);
    // hanging chain
    c.strokeStyle = '#080404'; c.lineWidth = 4; c.setLineDash([6, 4]);
    c.beginPath(); c.moveTo(x + pw + 40, h - 660); c.lineTo(x + pw + 40, h - 240 - r() * 100); c.stroke(); c.setLineDash([]);
  }
}

const art: BackdropArt = {
  sky: [[0, '#07030a'], [0.35, '#2a0d12'], [0.7, '#7a1d12'], [1, '#d4501a']],
  far: { w: 2048, h: 520, draw: farVolcano },
  mid: { w: 2048, h: 400, draw: midFortress },
  near: { w: 2048, h: 660, draw: nearPipes },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const { w, h, zoom, t } = f;
  // ash plume rolling off the crater, lit from beneath
  const vx = f.sx(0.1, 1000), vy = f.sy(0.1, 0.88, 400);
  for (let i = 0; i < 9; i++) {
    const u = (t * 0.07 + i / 9) % 1;
    g.fillStyle(0x1a0c0c, 0.55 * (1 - u * 0.6)).fillCircle(vx + Math.sin(u * 6 + i) * 60 * zoom + u * 220 * zoom, vy - u * 380 * zoom, (50 + u * 130) * zoom);
    g.fillStyle(0xff6a1a, 0.10 * (1 - u)).fillCircle(vx + Math.sin(u * 6 + i) * 60 * zoom + u * 220 * zoom, vy - u * 380 * zoom + 30 * zoom, (40 + u * 90) * zoom);
  }
  // lava bombs lobbed from the crater
  for (let i = 0; i < 3; i++) {
    const u = ((t * 0.18 + i / 3) % 1);
    const bx = vx + (i - 1) * 140 * u * zoom + Math.sin(i) * 30 * zoom, by = vy - Math.sin(u * Math.PI) * 340 * zoom + u * 80 * zoom;
    g.fillStyle(0xffd24a, 1 - u * 0.4).fillCircle(bx, by, 4 * zoom);
    g.fillStyle(0xff6a1a, 0.3 * (1 - u)).fillCircle(bx, by, 11 * zoom);
  }
  // heat glow breathing on the horizon + distant lightning in the ash cloud
  g.fillStyle(0xff5a10, 0.07 + 0.03 * Math.sin(t * 1.3)).fillRect(0, h * 0.62, w, h * 0.4);
  const cyc = t % 9;
  if (cyc < 0.25) g.fillStyle(0xffb070, 0.18 * (1 - cyc / 0.25)).fillRect(0, 0, w, h * 0.5);
  // far embers drifting up and across
  for (let i = 0; i < 26; i++) {
    const u = (t * (0.05 + hash(i) * 0.06) + hash(i * 3)) % 1;
    const ex = ((hash(i * 7) * w + Math.sin(t * 0.4 + i) * 30 * zoom - f.midX * 0.08 * zoom) % w + w) % w;
    g.fillStyle(i % 3 ? 0xff8a2a : 0xffd24a, (1 - u) * 0.9).fillRect(ex, h - u * h * 0.9, 2.5 * zoom, 2.5 * zoom);
  }
}

/* ------------------------------------------------------------------ shared drawing */

export function flame(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, hgt: number, t: number, seed: number): void {
  // three nested flame tongues, flickering independently
  const n = Math.max(3, Math.floor(w / 14));
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) - 0.5;
    const fh = hgt * (0.55 + 0.45 * Math.abs(Math.sin(t * (6 + i) + seed + i * 1.9))) * (1 - Math.abs(u) * 0.6);
    const fx = x + u * w, sway = Math.sin(t * 5 + i + seed) * 4;
    g.fillStyle(EMBER.red, 0.8).fillTriangle(fx - w / n, y, fx + w / n, y, fx + sway, y - fh);
    g.fillStyle(EMBER.fire, 0.95).fillTriangle(fx - w / n * 0.7, y, fx + w / n * 0.7, y, fx + sway, y - fh * 0.78);
    g.fillStyle(EMBER.hot, 1).fillTriangle(fx - w / n * 0.35, y, fx + w / n * 0.35, y, fx + sway * 0.7, y - fh * 0.45);
  }
}

function brickWall(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, seed: number): void {
  g.fillStyle(EMBER.brick, 1).fillRect(x, y, w, h);
  g.fillStyle(0x000000, 0.35);
  for (let by = y, r = 0; by < y + h; by += 16, r++) {
    g.fillRect(x, by, w, 2);
    for (let bx = x + (r % 2) * 20; bx < x + w; bx += 40) g.fillRect(bx, by, 2, 16);
  }
  g.fillStyle(0xff6a1a, 0.06 + 0.04 * hash(seed)).fillRect(x, y + h * 0.5, w, h * 0.5); // forge glow washes up from below
  g.fillStyle(0x000000, 0.4).fillRect(x, y, w, 10);
}

export function cracks(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, seed: number, a = 0.8): void {
  g.lineStyle(2, EMBER.fire, a);
  const n = Math.max(1, Math.floor(w / 90));
  for (let i = 0; i < n; i++) {
    let cx = x + hash(seed + i) * w, cy = y + 4;
    g.beginPath(); g.moveTo(cx, cy);
    for (let s = 0; s < 5; s++) { cx += (hash(seed + i * 9 + s) - 0.5) * 26; cy += h / 5; g.lineTo(cx, Math.min(cy, y + h)); }
    g.strokePath();
  }
}

export const foundryTheme: WorldTheme = {
  id: 'foundry',
  accent: EMBER.fire,
  backdrop: art,
  backdropFx,
  bed: {
    top: GROUND_Y + 42,
    draw(g, x0, x1, t) {
      const top = GROUND_Y + 42;
      g.fillStyle(0x7a1a08, 1).fillRect(x0, top, x1 - x0, 1080 - top + 40);
      g.fillStyle(0xe8541a, 1).fillRect(x0, top, x1 - x0, 26);
      g.fillStyle(0xffb040, 0.9);
      for (let x = Math.floor(x0 / 70) * 70; x < x1; x += 70) g.fillRect(x + Math.sin(t * 1.2 + x * 0.04) * 18, top + 4 + Math.sin(t * 2 + x) * 3, 38, 4);
      g.fillStyle(0x2a0a04, 0.75); // cooling crust drifting on the surface
      for (let x = Math.floor(x0 / 150) * 150; x < x1; x += 150) g.fillRect(x + Math.sin(t * 0.5 + x) * 24, top + 30, 70, 8);
      for (let i = 0; i < 10; i++) { // bubbles
        const u = (t * 0.6 + hash(i + Math.floor(x0 / 400))) % 1;
        g.fillStyle(0xffd24a, 1 - u).fillCircle(x0 + hash(i * 5 + Math.floor(x0 / 400)) * (x1 - x0), top + 16 - u * 6, 3 + u * 7);
      }
      g.fillStyle(0xff7a20, 0.12).fillRect(x0, top - 40, x1 - x0, 40);
    },
  },

  drawSolid(g, s) {
    switch (s.kind) {
      case 'ground': { // basalt causeway, glowing seams, stone arches over the lava
        g.fillStyle(EMBER.basalt2, 1).fillRect(s.x, s.y, s.w, 30);
        g.fillStyle(0x3a2a26, 1).fillRect(s.x, s.y, s.w, 6);
        g.fillStyle(EMBER.fire, 0.55).fillRect(s.x, s.y + 6, s.w, 2);
        for (let x = s.x; x < s.x + s.w; x += 120) {
          g.fillStyle(0x000000, 0.5).fillRect(x, s.y + 6, 3, 24);
          cracks(g, x + 4, s.y + 8, 110, 20, x * 0.1, 0.55);
        }
        g.fillStyle(0x0d0807, 1).fillRect(s.x, s.y + 30, s.w, 12);
        g.fillStyle(EMBER.fire, 0.35).fillRect(s.x, s.y + 40, s.w, 2);
        for (let x = s.x + 80; x < s.x + s.w; x += 200) { // arch piers
          g.fillStyle(EMBER.basalt, 1).fillRect(x, s.y + 42, 44, s.h - 42);
          g.fillStyle(0x3a2a26, 1).fillRect(x, s.y + 42, 6, s.h - 42);
          g.fillStyle(EMBER.fire, 0.35).fillRect(x + 38, s.y + 42, 3, s.h - 42);
          g.fillStyle(EMBER.basalt, 1).fillTriangle(x - 70, s.y + 42, x, s.y + 42, x, s.y + 74).fillTriangle(x + 44, s.y + 42, x + 114, s.y + 42, x + 44, s.y + 74);
        }
        break;
      }
      case 'roof': { // riveted iron deck, heat vents, glowing underside
        g.fillStyle(EMBER.iron2, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0x5a4a42, 1).fillRect(s.x, s.y, s.w, 5);
        g.fillStyle(0x000000, 0.4).fillRect(s.x, s.y + 5, s.w, 2);
        for (let x = s.x + 14; x < s.x + s.w - 6; x += 28) g.fillStyle(0x7a665a, 1).fillCircle(x, s.y + 12, 2.5);
        for (let x = s.x + 50; x < s.x + s.w - 50; x += 140) { g.fillStyle(0x0d0807, 1).fillRect(x, s.y - 3, 46, 5); g.fillStyle(EMBER.fire, 0.9).fillRect(x + 4, s.y - 2, 38, 2); }
        g.fillStyle(EMBER.fire, 0.95).fillRect(s.x, s.y + s.h - 4, s.w, 4);
        g.fillStyle(EMBER.fire, 0.20).fillRect(s.x, s.y + s.h, s.w, 14);
        break;
      }
      case 'crate': { // stacked cast ingots
        const rows = Math.max(1, Math.round(s.h / 35));
        const rh = s.h / rows;
        for (let r = 0; r < rows; r++) {
          const y = s.y + r * rh, hot = Math.max(0, 1 - r * 0.5);
          g.fillStyle(0x2a2220, 1).fillRect(s.x, y, s.w, rh);
          g.fillStyle(0x4a3a34, 1).fillRect(s.x + 3, y + 3, s.w - 6, rh - 6);
          g.fillStyle(EMBER.fire, 0.18 + 0.4 * hot).fillRect(s.x + 3, y + 3, s.w - 6, rh - 6);
          g.fillStyle(EMBER.hot, 0.5 * hot).fillRect(s.x + 8, y + 6, s.w - 16, 4);
          g.fillStyle(0x000000, 0.4).fillRect(s.x + s.w / 2 - 1, y, 2, rh);
        }
        g.fillStyle(0xffffff, 0.12).fillRect(s.x, s.y, s.w, 3);
        break;
      }
      case 'wall': {
        g.fillStyle(EMBER.basalt2, 1).fillRect(s.x, s.y, s.w, s.h);
        cracks(g, s.x + 4, s.y, s.w - 8, s.h, 7, 0.8);
        g.fillStyle(EMBER.fire, 0.6).fillRect(s.x, s.y, 3, s.h);
        break;
      }
      case 'gate': {
        g.fillStyle(EMBER.iron, 1).fillRect(s.x, s.y, s.w, s.h);
        break;
      }
    }
  },

  drawLedge(g, o) { // iron grating hung on chains, glowing from the heat below
    g.fillStyle(EMBER.fire, 0.20).fillRect(o.x, o.y + 6, o.w, 24);
    g.fillStyle(0x4a3a34, 1).fillRect(o.x, o.y, o.w, 6);
    g.fillStyle(0x8a7466, 1).fillRect(o.x, o.y, o.w, 2);
    g.fillStyle(0x15100e, 1).fillRect(o.x, o.y + 6, o.w, 7);
    g.fillStyle(EMBER.fire, 0.9);
    for (let x = o.x + 6; x < o.x + o.w - 6; x += 12) g.fillRect(x, o.y + 8, 6, 3);
    g.lineStyle(3, 0x15100e, 1);
    for (let x = o.x + 10; x < o.x + o.w - 8; x += 36) g.lineBetween(x, o.y + 13, x + 14, o.y + 24);
    g.lineStyle(3, 0x0d0807, 1);
    for (const ex of [o.x + 6, o.x + o.w - 6]) for (let y = o.y - 80; y < o.y; y += 11) g.strokeEllipse(ex, y + 5, 6, 10);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'forge_wall': {
        brickWall(g, d.x, d.y, d.w, d.h, d.seed);
        for (let x = d.x + 40; x < d.x + d.w - 80; x += 190) { // furnace mouths
          const mh = Math.min(70, d.h - 40);
          g.fillStyle(0x0d0807, 1).fillRect(x, d.y + d.h - mh - 6, 70, mh).fillTriangle(x, d.y + d.h - mh - 6, x + 70, d.y + d.h - mh - 6, x + 35, d.y + d.h - mh - 28);
          g.fillStyle(EMBER.fire, 0.55).fillRect(x + 6, d.y + d.h - mh + 6, 58, mh - 14);
          g.fillStyle(EMBER.hot, 0.6).fillRect(x + 14, d.y + d.h - 26, 42, 14);
          g.fillStyle(EMBER.fire, 0.12).fillCircle(x + 35, d.y + d.h - 30, 80);
        }
        g.fillStyle(EMBER.iron, 1);
        for (let x = d.x; x < d.x + d.w; x += 260) g.fillRect(x, d.y, 10, d.h);
        break;
      }
      case 'bastion': {
        g.fillStyle(0x1c100e, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x2a1a16, 1).fillRect(d.x, d.y, 5, d.h);
        for (let x = d.x; x < d.x + d.w - 18; x += 36) g.fillStyle(0x1c100e, 1).fillRect(x, d.y - 22, 22, 22);
        g.fillStyle(0x120907, 1).fillTriangle(d.x - 10, d.y - 22, d.x + d.w + 10, d.y - 22, d.x + d.w / 2, d.y - 90);
        g.fillStyle(EMBER.fire, 0.9);
        for (let y = d.y + 40; y < d.y + d.h - 60; y += 70) for (let x = d.x + 22; x < d.x + d.w - 20; x += 54) g.fillRect(x, y, 5, 22);
        g.fillStyle(EMBER.fire, 0.07).fillRect(d.x - 10, d.y, d.w + 20, d.h);
        break;
      }
      case 'smokestack': {
        const x = d.x, top = d.y - d.h;
        g.fillStyle(0x1c100e, 1).fillPoints([{ x: x - d.w / 2, y: d.y }, { x: x - d.w / 2 + 10, y: top }, { x: x + d.w / 2 - 10, y: top }, { x: x + d.w / 2, y: d.y }], true);
        g.fillStyle(0x2a1a16, 1).fillRect(x - d.w / 2 + 6, top, 8, d.h);
        g.fillStyle(EMBER.iron2, 1);
        for (let y = top + 30; y < d.y - 20; y += 64) g.fillRect(x - d.w / 2 + 6 + (y - top) / d.h * 6, y, d.w - 12 - (y - top) / d.h * 12, 8);
        g.fillStyle(EMBER.fire, 0.95).fillRect(x - d.w / 2 + 6, top - 5, d.w - 12, 8);
        break;
      }
      case 'furnace': {
        g.fillStyle(0x24140f, 1).fillRect(d.x, d.y, d.w, d.h);
        brickWall(g, d.x + 6, d.y + 6, d.w - 12, d.h - 6, d.seed);
        g.fillStyle(0x0d0807, 1).fillRect(d.x + d.w * 0.2, d.y + d.h * 0.35, d.w * 0.6, d.h * 0.65).fillTriangle(d.x + d.w * 0.2, d.y + d.h * 0.35, d.x + d.w * 0.8, d.y + d.h * 0.35, d.x + d.w / 2, d.y + d.h * 0.12);
        g.fillStyle(EMBER.iron2, 1).fillRect(d.x - 8, d.y + d.h - 10, d.w + 16, 10).fillRect(d.x + d.w * 0.4, d.y - 70, d.w * 0.2, 70);
        g.fillStyle(EMBER.fire, 0.9).fillRect(d.x + d.w * 0.4, d.y - 74, d.w * 0.2, 4);
        break;
      }
      case 'gear': { // mount only; the wheel itself turns in the animation pass
        g.fillStyle(EMBER.iron, 1).fillRect(d.x - 10, d.y, 20, d.h);
        break;
      }
      case 'piston': {
        g.fillStyle(EMBER.iron2, 1).fillRect(d.x, d.y, d.w, d.h * 0.55);
        g.fillStyle(0x0d0807, 1).fillRect(d.x - 6, d.y - 8, d.w + 12, 12);
        g.fillStyle(EMBER.fire, 0.6).fillRect(d.x, d.y + d.h * 0.2, d.w, 3);
        for (let y = d.y + 8; y < d.y + d.h * 0.55; y += 22) g.fillStyle(0x6a5a50, 1).fillRect(d.x + 3, y, d.w - 6, 3);
        break;
      }
      case 'lavafall': { // spout from a cracked wall
        g.fillStyle(0x0d0807, 1).fillRect(d.x - 26, d.y, 52, 30).fillRect(d.x - 14, d.y + 30, 28, 14);
        g.fillStyle(EMBER.fire, 0.5).fillRect(d.x - 14, d.y + 40, 28, 4);
        break;
      }
      case 'rail': { // overhead ladle rail
        g.fillStyle(EMBER.iron2, 1).fillRect(d.x, d.y, d.w, 10);
        g.fillStyle(0x0d0807, 1);
        for (let x = d.x; x < d.x + d.w; x += 60) g.fillRect(x, d.y - 40, 8, 40);
        break;
      }
      case 'brazier': {
        g.fillStyle(EMBER.iron, 1).fillRect(d.x - 4, d.y - d.h, 8, d.h).fillTriangle(d.x - 22, d.y - d.h, d.x + 22, d.y - d.h, d.x, d.y - d.h + 28);
        g.fillStyle(0x0d0807, 1).fillRect(d.x - 28, d.y - d.h - 10, 56, 12);
        g.fillStyle(EMBER.fire, 0.08).fillCircle(d.x, d.y - d.h - 20, 90);
        break;
      }
      case 'plate': { // forged sign
        g.fillStyle(EMBER.iron, 1).fillRect(d.x + 10, d.y + d.h, 6, 40).fillRect(d.x + d.w - 16, d.y + d.h, 6, 40);
        g.fillStyle(0x15100e, 1).fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(3, EMBER.fire, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(EMBER.fire, 0.12).fillRect(d.x - 8, d.y - 8, d.w + 16, d.h + 16);
        ctx.text(d, EMBER.hot);
        break;
      }
      case 'pipes': {
        g.fillStyle(EMBER.iron2, 1).fillRect(d.x, d.y, d.w, 12).fillRect(d.x, d.y + 26, d.w, 8);
        g.fillStyle(EMBER.fire, 0.8).fillRect(d.x, d.y + 5, d.w, 2);
        for (let x = d.x; x < d.x + d.w; x += 150) { g.fillStyle(EMBER.iron, 1).fillRect(x, d.y, 10, d.h); g.fillStyle(EMBER.fire, 1).fillCircle(x + 5, d.y + 6, 4); }
        break;
      }
      case 'door': {
        g.fillStyle(0x0d0807, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(EMBER.iron2, 1);
        for (let y = d.y + 8; y < d.y + d.h; y += 28) g.fillRect(d.x + 6, y, d.w - 12, 16);
        g.lineStyle(5, EMBER.fire, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(EMBER.fire, 0.18).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(EMBER.hot, 0.9).fillTriangle(d.x + d.w / 2 - 14, d.y + d.h * 0.55, d.x + d.w / 2 + 14, d.y + d.h * 0.55, d.x + d.w / 2, d.y + d.h * 0.25);
        if (d.text) ctx.text({ ...d, y: d.y - 34, h: 24 }, 0xffffff);
        break;
      }
      case 'chain': {
        g.lineStyle(5, 0x0a0605, 0.92);
        for (let y = d.y; y < d.y + d.h; y += 13) g.strokeEllipse(d.x + (Math.floor(y / 13) % 2) * 2, y + 6, 9, 13);
        g.fillStyle(0x0a0605, 0.95).fillRect(d.x - 14, d.y + d.h, 28, 26);
        g.fillStyle(EMBER.fire, 0.8).fillRect(d.x - 10, d.y + d.h + 18, 20, 5);
        break;
      }
      case 'crucible': { // molten-metal cauldron on the ground
        g.fillStyle(0x24140f, 1).fillPoints([{ x: d.x, y: d.y }, { x: d.x + d.w, y: d.y }, { x: d.x + d.w - 14, y: d.y + d.h }, { x: d.x + 14, y: d.y + d.h }], true);
        g.fillStyle(EMBER.iron2, 1).fillRect(d.x - 4, d.y, d.w + 8, 8);
        break;
      }
    }
  },

  animated: {
    furnace: {
      layer: 'back', pad: 140,
      draw(g, d, t) {
        const cx = d.x + d.w / 2, my = d.y + d.h;
        flame(g, cx, my - 8, d.w * 0.5, d.h * 0.5, t, d.seed);
        glow(g, cx, d.y + d.h * 0.6, 150, EMBER.fire, 0.35 + 0.1 * Math.sin(t * 7 + d.seed));
        for (let i = 0; i < 4; i++) { const u = (t * 0.8 + i / 4) % 1; g.fillStyle(EMBER.hot, 1 - u).fillRect(cx + Math.sin(u * 8 + i) * 24, d.y - 70 - u * 140, 2.5, 2.5); }
      },
    },
    brazier: {
      layer: 'back', pad: 100,
      draw(g, d, t) {
        flame(g, d.x, d.y - d.h - 8, 40, 56, t, d.seed);
        glow(g, d.x, d.y - d.h - 24, 120, EMBER.fire, 0.3 + 0.1 * Math.sin(t * 9 + d.seed));
      },
    },
    smokestack: {
      layer: 'back', pad: 260,
      draw(g, d, t) {
        const top = d.y - d.h;
        for (let i = 0; i < 7; i++) {
          const u = (t * 0.12 + i / 7) % 1;
          g.fillStyle(0x1a1010, 0.7 * (1 - u)).fillCircle(d.x + Math.sin(u * 5 + i) * 18 + u * 90, top - 10 - u * 300, 22 + u * 60);
          g.fillStyle(EMBER.fire, 0.12 * (1 - u)).fillCircle(d.x + Math.sin(u * 5 + i) * 18 + u * 90, top - 4 - u * 300, 16 + u * 36);
        }
      },
    },
    gear: {
      layer: 'back', pad: 20,
      draw(g, d, t) { // d.w = outer diameter
        const R = d.w / 2, dir = d.seed % 2 ? 1 : -1, rot = t * 0.5 * dir;
        const pts: { x: number; y: number }[] = [];
        const teeth = 14;
        for (let i = 0; i < teeth * 4; i++) {
          const a = rot + (i / (teeth * 4)) * Math.PI * 2;
          const k = i % 4;
          const rr = k === 1 || k === 2 ? R : R * 0.86;
          pts.push({ x: d.x + Math.cos(a) * rr, y: d.y + Math.sin(a) * rr });
        }
        g.fillStyle(0x24160f, 1).fillPoints(pts, true);
        g.fillStyle(0x3a2a22, 1).fillCircle(d.x, d.y, R * 0.7);
        g.fillStyle(0x15100e, 1).fillCircle(d.x, d.y, R * 0.5);
        for (let i = 0; i < 5; i++) { const a = rot + (i / 5) * Math.PI * 2; g.lineStyle(R * 0.14, 0x3a2a22, 1).lineBetween(d.x, d.y, d.x + Math.cos(a) * R * 0.68, d.y + Math.sin(a) * R * 0.68); }
        g.fillStyle(EMBER.fire, 0.9).fillCircle(d.x, d.y, R * 0.12);
        g.lineStyle(2, EMBER.fire, 0.45).strokeCircle(d.x, d.y, R * 0.86);
      },
    },
    piston: {
      layer: 'back', pad: 30,
      draw(g, d, t) {
        const stroke = (0.5 + 0.5 * Math.sin(t * 2.2 + d.seed)) * (d.h * 0.4);
        const top = d.y + d.h * 0.55;
        g.fillStyle(0x8a7466, 1).fillRect(d.x + d.w * 0.35, top - 10, d.w * 0.3, 10 + stroke);
        g.fillStyle(EMBER.iron2, 1).fillRect(d.x - 4, top + stroke, d.w + 8, 16);
        g.fillStyle(EMBER.fire, 0.8).fillRect(d.x - 4, top + stroke + 14, d.w + 8, 2);
        if (stroke > d.h * 0.37) for (let i = 0; i < 4; i++) { g.fillStyle(0xffd0a0, 0.35).fillCircle(d.x + d.w / 2 + (i - 1.5) * 16, top + stroke + 20 + i * 4, 8); }
      },
    },
    lavafall: {
      layer: 'back', pad: 40,
      draw(g, d, t) {
        const len = GROUND_Y + 30 - (d.y + 44);
        g.fillStyle(EMBER.fire, 0.95).fillRect(d.x - 10, d.y + 44, 20, len);
        g.fillStyle(EMBER.hot, 0.9);
        for (let y = d.y + 44 + ((t * 160) % 60); y < d.y + 44 + len; y += 60) g.fillRect(d.x - 5, y, 10, 26);
        g.fillStyle(EMBER.fire, 0.12).fillRect(d.x - 40, d.y + 44, 80, len);
        glow(g, d.x, GROUND_Y + 30, 90, EMBER.fire, 0.4 + 0.1 * Math.sin(t * 5));
      },
    },
    rail: {
      layer: 'back', pad: 80,
      draw(g, d, t) { // ladle trundles along the rail and tips molten metal at the end of each run
        const cyc = 14, ph = (t + d.seed) % cyc;
        const u = ph < 7 ? ph / 7 : 1 - (ph - 7) / 7;
        const lx = d.x + 70 + u * (d.w - 140);
        const tip = (ph > 6.4 && ph < 7.4) ? Math.sin(((ph - 6.4) / 1) * Math.PI) : 0;
        g.fillStyle(0x0d0807, 1).fillRect(lx - 14, d.y + 10, 28, 12);
        g.lineStyle(3, 0x0d0807, 1).lineBetween(lx, d.y + 22, lx - tip * 12, d.y + 70);
        const bx = lx - tip * 12, by = d.y + 70;
        g.fillStyle(0x3a2a22, 1).fillPoints([{ x: bx - 30, y: by }, { x: bx + 30, y: by }, { x: bx + 22, y: by + 40 }, { x: bx - 22, y: by + 40 }], true);
        g.fillStyle(EMBER.fire, 1).fillRect(bx - 26, by + 1, 52, 6);
        g.fillStyle(EMBER.hot, 0.9).fillRect(bx - 18, by + 2, 36, 3);
        if (tip > 0.2) { g.fillStyle(EMBER.hot, 0.95).fillRect(bx + 30 - tip * 6, by + 10, 7, GROUND_Y - by - 10); glow(g, bx + 33, GROUND_Y, 70, EMBER.fire, 0.5); }
        glow(g, bx, by + 4, 60, EMBER.fire, 0.25);
      },
    },
    banner: {
      layer: 'back', pad: 70,
      draw(g, d, t) {
        g.fillStyle(EMBER.iron, 1).fillRect(d.x + d.w / 2 - 2, d.y, 4, d.h + 40);
        g.fillStyle(0x15100e, 1);
        const x0 = d.x + d.w / 2 + 2;
        g.beginPath(); g.moveTo(x0, d.y + 4);
        for (let i = 0; i <= 8; i++) g.lineTo(x0 + i * 8, d.y + 4 + Math.sin(t * 4 + i * 0.8) * (1 + i * 0.7));
        for (let i = 8; i >= 0; i--) g.lineTo(x0 + i * 8, d.y + 80 + Math.sin(t * 4 + i * 0.8) * (1 + i * 0.7) - (i === 8 ? 16 : 0));
        g.closePath(); g.fillPath();
        g.fillStyle(EMBER.fire, 1).fillTriangle(x0 + 10, d.y + 54, x0 + 44, d.y + 54, x0 + 27, d.y + 16 + Math.sin(t * 6) * 3);
      },
    },
    door: {
      layer: 'back', pad: 20,
      draw(g, d, t) { g.fillStyle(EMBER.fire, 0.10 + 0.05 * Math.sin(t * 4)).fillRect(d.x - 20, d.y - 20, d.w + 40, d.h + 20); },
    },
    crucible: {
      layer: 'back', pad: 100,
      draw(g, d, t) {
        g.fillStyle(EMBER.fire, 1).fillRect(d.x + 8, d.y + 3 + Math.sin(t * 3) , d.w - 16, 8);
        g.fillStyle(EMBER.hot, 0.9).fillRect(d.x + 18, d.y + 4, d.w - 36, 4);
        glow(g, d.x + d.w / 2, d.y, 110, EMBER.fire, 0.35);
      },
    },
  },

  ambient(scene): AmbientParticles {
    heat.erupt = -99;
    const g = scene.add.graphics().setDepth(68);
    return {
      update(_dt, view, t) { // rising embers, falling ash
        g.clear();
        const W = view.width, H = view.height;
        for (let i = 0; i < 60; i++) {
          const sp = 40 + hash(i + 3) * 80;
          const px = view.left + (((hash(i) * W + Math.sin(t * 0.7 + i) * 30 + t * 12) % W) + W) % W;
          const py = view.bottom - (((hash(i + 40) * H + t * sp) % H) + H) % H;
          const u = (view.bottom - py) / H;
          g.fillStyle(i % 3 === 0 ? EMBER.hot : EMBER.fire, Math.min(1, (1 - u) * 1.2)).fillRect(px, py, 2.5, 2.5);
        }
        g.fillStyle(0x2a2220, 0.55);
        for (let i = 0; i < 16; i++) {
          const px = view.left + (((hash(i + 80) * W - t * 20) % W) + W) % W;
          const py = view.top + (((hash(i + 120) * H + t * 36) % H) + H) % H;
          g.fillRect(px, py, 3, 2);
        }
        g.fillStyle(0xff4a0a, 0.05).fillRect(view.left, view.bottom - 120, W, 120); // heat bloom at the bottom edge
      },
    };
  },
};
