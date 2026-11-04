import Phaser from 'phaser';
import type { AmbientParticles, AnimatedDecor, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, hash, mulberry32, vgrad, wrapX } from '../../kit';

/**
 * NEON STREET: rain-soaked cyberpunk megacity. Glass skyscrapers, holographic hover-pads, billboards, skybridges,
 * a maglev line in the haze and drones in the sky. Cold blue steel lit by magenta / cyan / amber neon.
 */

export const NEON = {
  cyan: 0x3df0ff, mag: 0xff3d9a, vio: 0x9b5cff, amber: 0xffb347, lime: 0x6bff9a,
  steel: 0x151a3a, steel2: 0x1e2550, road: 0x0d1128, dark: 0x080a1c,
} as const;
export const NEON_SIGNS = [NEON.mag, NEON.cyan, 0xffd24a, NEON.vio, NEON.lime];

/* ------------------------------------------------------------------ backdrop art */

type Ctx = CanvasRenderingContext2D;

function crown(c: Ctx, x: number, top: number, w: number, r: () => number, fill: string): void {
  // setback tiers + antenna: gives each tower a distinct profile instead of a flat box
  const tiers = 1 + Math.floor(r() * 3);
  let cx = x, cw = w, cy = top;
  for (let i = 0; i < tiers; i++) {
    cw *= 0.72; cx += (w - cw) * (0.35 + r() * 0.3) * (i === 0 ? 1 : 0.5);
    const th = 16 + r() * 34;
    c.fillStyle = fill; c.fillRect(cx, cy - th, cw, th);
    cy -= th;
  }
  if (r() < 0.7) { c.fillStyle = fill; c.fillRect(cx + cw / 2 - 1.5, cy - 40 - r() * 60, 3, 70); }
}

function farTowers(c: Ctx, w: number, h: number): void {
  vgrad(c, 0, 0, w, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(255,61,154,0.20)']]);
  const r = mulberry32(31);
  for (let x = 0; x < w; ) {
    const bw = 50 + r() * 90, bh = 140 + r() * 220;
    const draw = (ox: number): void => {
      c.fillStyle = '#0d1030'; c.fillRect(ox, h - bh, bw, bh);
      crown(c, ox, h - bh, bw, r, '#0d1030');
      c.fillStyle = 'rgba(61,240,255,0.5)';
      for (let i = 0; i < 6; i++) if (r() < 0.5) c.fillRect(ox + 6 + r() * (bw - 14), h - bh + 10 + r() * (bh - 40), 2, 3);
    };
    wrapX(w, x, bw, draw);
    x += bw + 8 + r() * 24;
  }
  // megastructures: slim spires with aircraft-warning lights and a ring station
  for (const sx of [380, 1240, 1820]) {
    c.fillStyle = '#0a0c26'; c.fillRect(sx, h - 410, 14, 410);
    c.fillRect(sx - 14, h - 300, 42, 300);
    c.fillStyle = 'rgba(255,60,90,0.9)'; c.fillRect(sx + 4, h - 420, 6, 6);
  }
  c.strokeStyle = 'rgba(155,92,255,0.35)'; c.lineWidth = 4;
  c.beginPath(); c.ellipse(900, h - 330, 120, 22, -0.08, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#0a0c26'; c.fillRect(892, h - 330, 16, 330);
}

function midTowers(c: Ctx, w: number, h: number): void {
  const r = mulberry32(57);
  for (let x = 0; x < w; ) {
    const bw = 70 + r() * 120, bh = 120 + r() * 230;
    const hue = r();
    const draw = (ox: number): void => {
      c.fillStyle = hue > 0.5 ? '#12163a' : '#171c46';
      c.fillRect(ox, h - bh, bw, bh);
      crown(c, ox, h - bh, bw, r, hue > 0.5 ? '#12163a' : '#171c46');
      // glass: vertical mullions + lit floors
      c.fillStyle = 'rgba(120,160,255,0.07)';
      for (let mx = ox + 12; mx < ox + bw - 4; mx += 14) c.fillRect(mx, h - bh, 1, bh);
      for (let wy = h - bh + 12; wy < h - 14; wy += 16) {
        for (let wx = ox + 6; wx < ox + bw - 8; wx += 14) {
          const q = r();
          if (q < 0.26) { c.fillStyle = q < 0.12 ? 'rgba(255,200,110,0.65)' : q < 0.2 ? 'rgba(61,240,255,0.6)' : 'rgba(255,61,154,0.55)'; c.fillRect(wx, wy, 8, 7); }
        }
      }
      // neon trim along one edge
      const col = ['#ff3d9a', '#3df0ff', '#9b5cff'][Math.floor(r() * 3)];
      c.fillStyle = col; c.globalAlpha = 0.7; c.fillRect(ox, h - bh, 2, bh); c.globalAlpha = 1;
      if (r() < 0.4) { // rooftop billboard
        const bwid = Math.min(bw - 16, 70), by = h - bh - 70;
        c.fillStyle = '#05061a'; c.fillRect(ox + 8, by, bwid, 38);
        const bg = c.createLinearGradient(ox, 0, ox + bwid, 0); bg.addColorStop(0, col); bg.addColorStop(1, '#ffd24a');
        c.globalAlpha = 0.65; c.fillStyle = bg; c.fillRect(ox + 11, by + 3, bwid - 6, 32); c.globalAlpha = 1;
        c.fillStyle = '#05061a'; c.fillRect(ox + 20, by + 38, 4, 30); c.fillRect(ox + bwid - 4, by + 38, 4, 30);
      }
    };
    wrapX(w, x, bw, draw);
    x += bw + 6 + r() * 18;
  }
  vgrad(c, 0, h - 90, w, 90, [[0, 'rgba(8,10,28,0)'], [1, 'rgba(8,10,28,0.55)']]);
}

function nearPylons(c: Ctx, w: number, h: number): void {
  const r = mulberry32(88);
  for (let x = 120; x < w; x += 360 + r() * 340) {
    const bw = 70 + r() * 90, bh = 300 + r() * 280;
    c.fillStyle = '#070816'; c.fillRect(x, h - bh, bw, bh);
    c.fillStyle = '#05060f'; c.fillRect(x + bw * 0.3, h - bh - 24, bw * 0.4, 24);
    const col = ['#ff3d9a', '#3df0ff', '#9b5cff'][Math.floor(r() * 3)];
    c.fillStyle = col; c.globalAlpha = 0.85; c.fillRect(x + bw - 3, h - bh + 8, 3, bh - 8); c.fillRect(x, h - bh + 8, 2, bh - 8); c.globalAlpha = 1;
    for (let y = h - bh + 40; y < h - 30; y += 34) { c.fillStyle = r() < 0.2 ? 'rgba(255,200,110,0.5)' : 'rgba(61,240,255,0.18)'; c.fillRect(x + 12, y, bw - 24, 4); }
    // sagging power cables to the next pylon
    c.strokeStyle = 'rgba(5,6,15,0.9)'; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + bw, h - bh + 14 + i * 10); c.quadraticCurveTo(x + bw + 160, h - bh + 70 + i * 10, x + bw + 320, h - bh + 14 + i * 10); c.stroke(); }
  }
}

const art: BackdropArt = {
  sky: [[0, '#05061a'], [0.45, '#14103a'], [0.8, '#3a1858'], [1, '#8a2a78']],
  far: { w: 2048, h: 460, draw: farTowers },
  mid: { w: 2048, h: 400, draw: midTowers },
  near: { w: 2048, h: 620, draw: nearPylons },
};

/* ------------------------------------------------------------------ backdrop animation */

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  const { w, h, zoom, t } = f;
  g.clear();
  // a pale ringed moon low in the haze, nearly fixed to the sky
  const mx = w * 0.74 - f.midX * 0.012 * zoom, my = h * 0.2;
  g.fillStyle(0xff7ad0, 0.10).fillCircle(mx, my, 120 * zoom);
  g.fillStyle(0xd8c8ff, 0.85).fillCircle(mx, my, 44 * zoom);
  g.fillStyle(0x7a5cc0, 0.5).fillCircle(mx + 12 * zoom, my + 6 * zoom, 38 * zoom);
  g.lineStyle(3 * zoom, 0xffc8ff, 0.55).strokeEllipse(mx, my, 150 * zoom, 22 * zoom);

  // searchlights sweeping from two mid-distance towers
  for (let i = 0; i < 2; i++) {
    const bx = f.sx(0.14, 900 + i * 2600);
    const by = f.sy(0.14, 0.88, 230);
    const a = -Math.PI / 2 + Math.sin(t * 0.55 + i * 2.1) * 0.5;
    const len = 520 * zoom, spread = 0.07;
    g.fillStyle(i ? NEON.mag : NEON.cyan, 0.07);
    g.fillTriangle(bx, by, bx + Math.cos(a - spread) * len, by + Math.sin(a - spread) * len, bx + Math.cos(a + spread) * len, by + Math.sin(a + spread) * len);
  }

  // maglev train gliding along an elevated line in the haze (screen-space so it always crosses the view)
  const railY = f.sy(0.2, 0.9, 210);
  g.fillStyle(0x0b0d28, 1).fillRect(0, railY + 12 * zoom, w, 6 * zoom);
  g.fillStyle(NEON.cyan, 0.35).fillRect(0, railY + 18 * zoom, w, 1.5 * zoom);
  for (let px = -((f.midX * 0.2 * zoom) % (260 * zoom)); px < w; px += 260 * zoom) g.fillStyle(0x0b0d28, 1).fillRect(px, railY + 18 * zoom, 8 * zoom, 120 * zoom);
  const cycle = 22, ph = (t % cycle) / cycle;
  const len = 420 * zoom;
  const tx = -len + ph * (w + len * 2) - f.midX * 0.05 * zoom;
  g.fillStyle(0x1a1f55, 1).fillRoundedRect(tx, railY - 14 * zoom, len, 26 * zoom, 8 * zoom);
  g.fillStyle(0xdff6ff, 0.9).fillTriangle(tx + len, railY - 14 * zoom, tx + len + 26 * zoom, railY + 4 * zoom, tx + len, railY + 12 * zoom);
  g.fillStyle(NEON.cyan, 0.9);
  for (let i = 0; i < 10; i++) g.fillRect(tx + 14 * zoom + i * 40 * zoom, railY - 8 * zoom, 26 * zoom, 8 * zoom);
  g.fillStyle(NEON.mag, 0.8).fillRect(tx, railY + 5 * zoom, len, 2 * zoom);

  // traffic: drones and air-cars on two altitude lanes
  for (let i = 0; i < 6; i++) {
    const lane = i % 2;
    const speed = (lane ? 70 : 38) * (0.7 + hash(i) * 0.6) * zoom;
    const dir = i % 3 === 0 ? -1 : 1;
    const span = w + 200 * zoom;
    let px = ((hash(i * 7) * span + t * speed * dir) % span + span) % span - 100 * zoom;
    px -= f.midX * (0.08 + lane * 0.05) * zoom;
    px = ((px % span) + span) % span - 100 * zoom;
    const py = h * (0.14 + 0.07 * lane + hash(i + 40) * 0.2) + Math.sin(t * 1.3 + i) * 5 * zoom;
    const col = i % 2 ? NEON.mag : NEON.cyan;
    g.fillStyle(col, 0.18).fillCircle(px, py, 9 * zoom);
    g.fillStyle(0x0b0d28, 1).fillRect(px - 6 * zoom, py - 2 * zoom, 12 * zoom, 4 * zoom);
    g.fillStyle(col, 1).fillRect(px - 1.5 * zoom * dir, py - 1 * zoom, 3 * zoom, 2 * zoom);
    if (Math.floor(t * 2 + i) % 2) g.fillStyle(0xff4d5e, 1).fillRect(px - 1 * zoom, py - 5 * zoom, 2 * zoom, 2 * zoom);
  }
}

/* ------------------------------------------------------------------ static geometry */

function hazard(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, a = 0.9): void {
  g.fillStyle(0x15151a, a).fillRect(x, y, w, h);
  g.fillStyle(0xffc233, a);
  for (let sx = x - h; sx < x + w; sx += h * 1.6) {
    const x0 = Math.max(sx, x), x1 = Math.min(sx + h * 0.8, x + w);
    if (x1 <= x0) continue;
    g.fillPoints([{ x: x0, y: y + h }, { x: Math.min(x1, x + w), y: y + h }, { x: Math.min(x1 + h, x + w), y }, { x: Math.min(x0 + h, x + w), y }], true);
  }
}

function lit(seed: number, i: number, chance: number): boolean { return hash(seed + i * 13.37) < chance; }

function tower(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, seed: number, skyline: boolean): void {
  const tone = hash(seed) > 0.5 ? 0x10153a : 0x161c46;
  const trim = NEON_SIGNS[Math.floor(hash(seed + 3) * NEON_SIGNS.length)];
  if (skyline) { // setback crown + antenna so skylines are not flat boxes
    const cw = w * 0.66, cx = x + (w - cw) * (0.3 + hash(seed + 9) * 0.4);
    g.fillStyle(tone, 1).fillRect(cx, y - 34, cw, 34);
    const c2 = cw * 0.55;
    g.fillRect(cx + (cw - c2) / 2, y - 62, c2, 28);
    g.fillRect(cx + cw / 2 - 2, y - 120, 4, 60);
    g.fillStyle(0xff4d5e, 1).fillCircle(cx + cw / 2, y - 120, 3);
  }
  g.fillStyle(tone, 1).fillRect(x, y, w, h);
  g.fillStyle(0x000000, 0.28).fillRect(x, y, w, 6);
  // glass curtain wall: mullions and lit floors
  g.fillStyle(0x7fa4ff, 0.06);
  for (let mx = x + 14; mx < x + w - 6; mx += 22) g.fillRect(mx, y + 8, 2, h - 8);
  const cols = Math.max(2, Math.floor(w / 28)), gap = w / cols;
  for (let r = 0, wy = y + 22; wy < y + h - 34; wy += 40, r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * 31 + c;
      const on = lit(seed, i, 0.34);
      const col = hash(seed + i * 5.1) < 0.5 ? 0xffd890 : hash(seed + i * 2.7) < 0.5 ? NEON.cyan : NEON.mag;
      g.fillStyle(on ? col : 0x0a0d26, on ? 0.78 : 1).fillRect(x + c * gap + gap * 0.18, wy, gap * 0.62, 20);
      if (on) g.fillStyle(col, 0.08).fillRect(x + c * gap + gap * 0.1, wy - 4, gap * 0.78, 28);
    }
  }
  // emissive edge trim and a horizontal accent band
  g.fillStyle(trim, 0.85).fillRect(x, y, 3, h);
  g.fillStyle(trim, 0.12).fillRect(x + 3, y, 12, h);
  if (h > 150) { const by = y + 40 + Math.floor(hash(seed + 4) * Math.max(1, h - 120)); g.fillStyle(trim, 0.55).fillRect(x, by, w, 3); g.fillStyle(trim, 0.1).fillRect(x, by - 5, w, 13); }
}

export const neonTheme: WorldTheme = {
  id: 'neon',
  accent: NEON.cyan,
  backdrop: art,
  backdropFx,

  drawSolid(g, s, ctx) {
    switch (s.kind) {
      case 'ground': {
        g.fillStyle(NEON.road, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0x2a3270, 1).fillRect(s.x, s.y, s.w, 8);
        g.fillStyle(NEON.cyan, 0.9).fillRect(s.x, s.y, s.w, 2);
        g.fillStyle(NEON.cyan, 0.10).fillRect(s.x, s.y + 2, s.w, 14); // wet-sheen reflection of the signs above
        // reflected neon smears
        for (let x = s.x + 40; x < s.x + s.w; x += 130) {
          const c = NEON_SIGNS[Math.floor(hash(x * 0.37) * NEON_SIGNS.length)];
          g.fillStyle(c, 0.14).fillRect(x, s.y + 8, 60 + hash(x) * 50, 4);
        }
        g.fillStyle(0xffc233, 0.75);
        for (let x = s.x + 30; x < s.x + s.w; x += 150) g.fillRect(x, s.y + 52, 72, 5); // lane dashes
        g.lineStyle(2, 0x2a3270, 0.7);
        for (let x = s.x; x < s.x + s.w; x += 200) g.lineBetween(x, s.y + 8, x, s.y + s.h);
        for (let x = s.x + 100; x < s.x + s.w; x += 400) { // drains with a violet glow
          g.fillStyle(0x05060f, 1).fillRect(x, s.y + 20, 44, 8);
          g.fillStyle(NEON.vio, 0.5).fillRect(x + 2, s.y + 22, 40, 2);
        }
        break;
      }
      case 'roof': { // hover deck: floating slab, emitter pods, glowing underside
        g.fillStyle(0x222a58, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0x3a4590, 1).fillRect(s.x, s.y, s.w, 5);
        g.fillStyle(NEON.cyan, 0.9).fillRect(s.x, s.y, s.w, 2);
        hazard(g, s.x, s.y + 7, Math.min(s.w, 60), 8, 0.9);
        hazard(g, s.x + s.w - Math.min(s.w, 60), s.y + 7, Math.min(s.w, 60), 8, 0.9);
        g.fillStyle(NEON.mag, 0.9).fillRect(s.x, s.y + s.h - 5, s.w, 3);
        g.fillStyle(NEON.mag, 0.16).fillRect(s.x, s.y + s.h - 2, s.w, 12);
        for (let x = s.x + 40; x < s.x + s.w - 20; x += 90) g.fillStyle(0x0a0d26, 1).fillRect(x, s.y + 12, 40, 8);
        for (const ex of [s.x + 14, s.x + s.w - 34]) { // thruster nozzles
          g.fillStyle(0x10143a, 1).fillRect(ex, s.y + s.h, 20, 8);
          g.fillStyle(NEON.cyan, 0.5).fillRect(ex + 4, s.y + s.h + 8, 12, 5);
        }
        break;
      }
      case 'crate': { // sealed cargo pod
        g.fillStyle(0x1b2150, 1).fillRect(s.x, s.y, s.w, s.h);
        g.lineStyle(3, 0x0a0d26, 1).strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
        for (let y = s.y + 30; y < s.y + s.h - 14; y += 56) {
          g.fillStyle(0x0a0d26, 1).fillRect(s.x + 14, y, s.w - 28, 22);
          g.fillStyle(NEON.cyan, 0.22);
          for (let gx = s.x + 18; gx < s.x + s.w - 18; gx += 8) g.fillRect(gx, y + 3, 4, 16);
        }
        g.fillStyle(NEON.mag, 0.9).fillRect(s.x, s.y, s.w, 3);
        g.fillStyle(NEON.mag, 0.9).fillRect(s.x + 6, s.y + 8, 5, 5);
        g.fillStyle(NEON.cyan, 0.35).fillRect(s.x + s.w - 6, s.y, 3, s.h);
        break;
      }
      case 'wall': {
        g.fillStyle(0x1b2150, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(NEON.cyan, 0.75).fillRect(s.x, s.y, 4, s.h);
        g.fillStyle(NEON.cyan, 0.12).fillRect(s.x + 4, s.y, 18, s.h);
        break;
      }
      case 'gate': { // energy shutter with laser bars
        g.fillStyle(0x1a1f45, 1).fillRect(s.x, s.y, s.w, s.h);
        for (let y = s.y; y < s.y + s.h; y += 26) {
          g.fillStyle(0x2c3470, 1).fillRect(s.x, y, s.w, 22);
          g.fillStyle(0xffc233, 0.9).fillRect(s.x + 4, y + 8, s.w - 8, 4);
        }
        g.fillStyle(NEON.mag, 0.85);
        for (let y = s.y + 12; y < s.y + s.h; y += 52) g.fillRect(s.x - 8, y, s.w + 16, 3);
        g.fillStyle(NEON.mag, 0.16).fillRect(s.x - 20, s.y, s.w + 40, s.h);
        g.lineStyle(3, 0xff3b6b, 0.95).strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
        break;
      }
    }
    void ctx;
  },

  drawLedge(g, o) { // holographic platform: translucent slab with emitter brackets
    g.fillStyle(NEON.cyan, 0.18).fillRect(o.x, o.y + 2, o.w, 22);
    g.fillStyle(0x0c1130, 0.9).fillRect(o.x, o.y, o.w, 7);
    g.fillStyle(NEON.cyan, 1).fillRect(o.x, o.y, o.w, 2);
    g.fillStyle(0xdffcff, 0.9).fillRect(o.x, o.y, o.w, 1);
    g.lineStyle(1, NEON.cyan, 0.3);
    for (let x = o.x + 10; x < o.x + o.w - 4; x += 18) g.lineBetween(x, o.y + 8, x - 5, o.y + 24);
    for (const ex of [o.x, o.x + o.w - 12]) {
      g.fillStyle(0x2a3270, 1).fillRect(ex, o.y - 4, 12, 16);
      g.fillStyle(NEON.mag, 1).fillRect(ex + 3, o.y - 2, 6, 3);
    }
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'skyscraper': tower(g, d.x, d.y, d.w, d.h, d.seed, true); break;
      case 'tower': tower(g, d.x, d.y, d.w, d.h, d.seed, false); break;
      case 'billboard': {
        const c = NEON_SIGNS[Math.floor(hash(d.seed) * NEON_SIGNS.length)];
        g.fillStyle(0x0a0d26, 1).fillRect(d.x + d.w * 0.18, d.y + d.h, 8, 150).fillRect(d.x + d.w * 0.78, d.y + d.h, 8, 150);
        g.fillStyle(0x1b2150, 1).fillRect(d.x - 6, d.y - 6, d.w + 12, d.h + 12);
        g.fillStyle(0x05061a, 1).fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(3, c, 1).strokeRect(d.x - 6, d.y - 6, d.w + 12, d.h + 12);
        g.fillStyle(c, 0.10).fillRect(d.x - 26, d.y - 26, d.w + 52, d.h + 52);
        break;
      }
      case 'hologram': { // projector base; the figure is animated
        g.fillStyle(0x2a3270, 1).fillRect(d.x + d.w / 2 - 34, d.y + d.h - 14, 68, 14);
        g.fillStyle(NEON.cyan, 0.8).fillRect(d.x + d.w / 2 - 34, d.y + d.h - 14, 68, 2);
        g.fillStyle(NEON.cyan, 0.08).fillTriangle(d.x + d.w / 2 - 28, d.y + d.h - 14, d.x + d.w / 2 + 28, d.y + d.h - 14, d.x + d.w / 2, d.y);
        break;
      }
      case 'neon': { // horizontal / vertical sign; d.text may contain a vertical label when h > w
        const c = NEON_SIGNS[Math.floor(hash(d.seed) * NEON_SIGNS.length)];
        g.fillStyle(0x070920, 1).fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(3, c, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.lineStyle(1, 0xffffff, 0.5).strokeRect(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
        g.fillStyle(c, 0.12).fillRect(d.x - 8, d.y - 8, d.w + 16, d.h + 16);
        g.fillStyle(0x2a3270, 1).fillRect(d.x + 10, d.y + d.h, 4, 22).fillRect(d.x + d.w - 14, d.y + d.h, 4, 22);
        ctx.text(d, c);
        break;
      }
      case 'skybridge': { // glazed tube between towers
        g.fillStyle(0x1b2150, 1).fillRoundedRect(d.x, d.y, d.w, d.h, d.h / 2);
        g.fillStyle(NEON.cyan, 0.22).fillRoundedRect(d.x + 4, d.y + 5, d.w - 8, d.h - 10, d.h / 2 - 4);
        g.fillStyle(0xffe6a8, 0.5);
        for (let x = d.x + 24; x < d.x + d.w - 24; x += 48) g.fillRect(x, d.y + d.h / 2 - 3, 20, 6);
        g.fillStyle(0x0a0d26, 1);
        for (let x = d.x + 60; x < d.x + d.w - 30; x += 220) g.fillRect(x, d.y + d.h - 4, 8, 80);
        g.fillStyle(NEON.mag, 0.7).fillRect(d.x + 10, d.y + d.h - 5, d.w - 20, 2);
        break;
      }
      case 'streetlight': {
        g.fillStyle(0x2a3270, 1).fillRect(d.x - 3, d.y - d.h, 6, d.h);
        g.fillRect(d.x - 3, d.y - d.h, 34, 5);
        g.fillStyle(0xbff6ff, 0.08).fillTriangle(d.x + 24, d.y - d.h + 6, d.x + 58, d.y, d.x - 10, d.y);
        g.fillStyle(0xe8fdff, 1).fillRect(d.x + 22, d.y - d.h + 5, 14, 4);
        g.fillStyle(NEON.cyan, 0.25).fillCircle(d.x + 29, d.y - d.h + 8, 26);
        break;
      }
      case 'pipes': { // glowing conduit bundle
        g.fillStyle(0x2a3270, 1).fillRect(d.x, d.y, d.w, 12).fillRect(d.x, d.y + 26, d.w, 8);
        g.fillStyle(NEON.cyan, 0.6).fillRect(d.x, d.y + 5, d.w, 2);
        g.fillStyle(NEON.mag, 0.6).fillRect(d.x, d.y + 29, d.w, 2);
        for (let x = d.x; x < d.x + d.w; x += 150) g.fillStyle(0x2a3270, 1).fillRect(x, d.y, 10, d.h);
        break;
      }
      case 'banner': { // hologram flag pole
        g.fillStyle(0x2a3270, 1).fillRect(d.x + d.w / 2 - 2, d.y, 4, d.h + 40);
        g.fillStyle(NEON.vio, 0.5).fillRect(d.x - 20, d.y + 6, d.w + 40, d.h * 0.5);
        g.lineStyle(2, NEON.vio, 1).strokeRect(d.x - 20, d.y + 6, d.w + 40, d.h * 0.5);
        g.fillStyle(0xffffff, 0.85).fillCircle(d.x + d.w / 2, d.y + 6 + d.h * 0.25, 9);
        break;
      }
      case 'arrow': {
        g.fillStyle(0xffd24a, 0.6);
        g.fillTriangle(d.x + d.w, d.y + d.h / 2, d.x + d.w - 24, d.y, d.x + d.w - 24, d.y + d.h);
        g.fillRect(d.x, d.y + d.h / 2 - 5, d.w - 24, 10);
        break;
      }
      case 'beacon': {
        g.fillStyle(0x2a3270, 1).fillRect(d.x + d.w / 2 - 5, d.y - d.h, 10, d.h);
        g.fillStyle(0x2a3270, 1).fillTriangle(d.x + d.w / 2 - 30, d.y, d.x + d.w / 2 + 30, d.y, d.x + d.w / 2, d.y - d.h * 0.6);
        break;
      }
      case 'door': { // blast door
        g.fillStyle(0x0a0d26, 1).fillRect(d.x, d.y, d.w, d.h);
        hazard(g, d.x, d.y, d.w, 10);
        g.lineStyle(4, NEON.mag, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(NEON.mag, 0.16).fillRect(d.x, d.y, d.w, d.h);
        if (d.text) ctx.text({ ...d, y: d.y - 34, h: 24 }, 0xffffff);
        break;
      }
      case 'vent': {
        g.fillStyle(0x2a3270, 1).fillRect(d.x, d.y - 26, d.w, 26);
        g.fillStyle(0x05060f, 1);
        for (let x = d.x + 6; x < d.x + d.w - 4; x += 8) g.fillRect(x, d.y - 22, 4, 18);
        break;
      }
      case 'cables': { // sagging power lines in front of the scene
        g.lineStyle(3, 0x05060f, 0.9);
        for (let i = 0; i < 3; i++) {
          g.beginPath(); g.moveTo(d.x, d.y + i * 7);
          for (let s = 1; s <= 16; s++) { const u = s / 16; g.lineTo(d.x + d.w * u, d.y + i * 7 + Math.sin(u * Math.PI) * d.h); }
          g.strokePath();
        }
        break;
      }
      case 'puddle': {
        g.fillStyle(0x2a3270, 0.55).fillEllipse(d.x + d.w / 2, d.y, d.w, 7);
        g.fillStyle(NEON.cyan, 0.2).fillEllipse(d.x + d.w / 2, d.y, d.w * 0.6, 4);
        break;
      }
    }
  },

  animated: {
    billboard: {
      layer: 'back', pad: 40,
      draw(g, d, t) {
        const c = NEON_SIGNS[Math.floor(hash(d.seed) * NEON_SIGNS.length)];
        const c2 = NEON_SIGNS[Math.floor(hash(d.seed + 1) * NEON_SIGNS.length)];
        const phase = Math.floor(t * 0.5 + d.seed) % 3;
        const flick = 0.75 + 0.25 * Math.sin(t * 17 + d.seed) * (hash(Math.floor(t * 3) + d.seed) > 0.9 ? 1 : 0.2);
        g.fillStyle(c, 0.55 * flick).fillRect(d.x + 4, d.y + 4, d.w - 8, d.h - 8);
        if (phase === 0) { g.fillStyle(c2, 0.8); const bw = (d.w - 20) / 8; for (let i = 0; i < 8; i++) { const bh = (d.h - 20) * (0.25 + 0.75 * Math.abs(Math.sin(t * 2 + i))); g.fillRect(d.x + 10 + i * bw, d.y + d.h - 8 - bh, bw - 4, bh); } }
        else if (phase === 1) { g.fillStyle(c2, 0.9).fillCircle(d.x + d.w / 2, d.y + d.h / 2, d.h * 0.28 + Math.sin(t * 4) * 5); g.lineStyle(3, 0xffffff, 0.8).strokeCircle(d.x + d.w / 2, d.y + d.h / 2, d.h * 0.38); }
        else { g.fillStyle(0xffffff, 0.85); for (let i = 0; i < 5; i++) g.fillRect(d.x + 14 + ((t * 90 + i * 60) % (d.w - 40)), d.y + 14 + i * (d.h - 28) / 5, 30, 5); }
        g.fillStyle(0x000000, 0.18);
        for (let y = d.y + ((t * 20) % 6); y < d.y + d.h; y += 6) g.fillRect(d.x, y, d.w, 2);
      },
    },
    hologram: {
      layer: 'back', pad: 70,
      draw(g, d, t) {
        const cx = d.x + d.w / 2, cy = d.y + d.h * 0.42, r = 32;
        const rot = t * 1.4;
        g.lineStyle(2, NEON.cyan, 0.9);
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 6; i++) { const a = rot + (i / 6) * Math.PI * 2; pts.push({ x: cx + Math.cos(a) * r * 0.8, y: cy + Math.sin(a) * 9 }); }
        for (let i = 0; i < 6; i++) {
          const a = pts[i], b = pts[(i + 1) % 6];
          g.lineBetween(a.x, a.y - r, b.x, b.y - r); g.lineBetween(a.x, a.y + r, b.x, b.y + r); g.lineBetween(a.x, a.y - r, a.x, a.y + r);
          g.lineBetween(a.x, a.y - r, cx, cy - r - 14); g.lineBetween(a.x, a.y + r, cx, cy + r + 14);
        }
        g.fillStyle(NEON.cyan, 0.12 + 0.06 * Math.sin(t * 6)).fillCircle(cx, cy, r + 8);
        const sy = d.y + ((t * 60) % d.h);
        g.fillStyle(0xffffff, 0.35).fillRect(cx - 40, sy, 80, 2);
      },
    },
    neon: {
      layer: 'back', pad: 20,
      draw(g, d, t) { // buzzing glow
        const c = NEON_SIGNS[Math.floor(hash(d.seed) * NEON_SIGNS.length)];
        const bad = hash(Math.floor(t * 6) + d.seed * 3) > 0.93;
        g.fillStyle(c, bad ? 0.02 : 0.14 + 0.05 * Math.sin(t * 3 + d.seed)).fillRect(d.x - 14, d.y - 14, d.w + 28, d.h + 28);
        if (bad) g.fillStyle(0x070920, 0.7).fillRect(d.x + 2, d.y + 2, d.w - 4, d.h - 4);
      },
    },
    beacon: {
      layer: 'back', pad: 80,
      draw(g, d, t) {
        const on = Math.floor(t * 1.6) % 2 === 0;
        const x = d.x + d.w / 2, y = d.y - d.h * 0.62;
        g.fillStyle(0xff4d5e, on ? 0.28 : 0.08).fillCircle(x, y, 54);
        g.fillStyle(0xff4d5e, on ? 1 : 0.35).fillCircle(x, y, 12);
      },
    },
    vent: {
      layer: 'front', pad: 140,
      draw(g, d, t) {
        for (let i = 0; i < 5; i++) {
          const u = ((t * 0.5 + i / 5) % 1);
          g.fillStyle(0xb8d8ff, 0.22 * (1 - u)).fillCircle(d.x + d.w / 2 + Math.sin(u * 5 + i) * 10, d.y - 26 - u * 120, 10 + u * 30);
        }
      },
    },
    streetlight: {
      layer: 'back', pad: 50,
      draw(g, d, t) {
        const fl = hash(Math.floor(t * 8) + d.seed) > 0.96 ? 0.4 : 1;
        g.fillStyle(NEON.cyan, 0.22 * fl).fillCircle(d.x + 29, d.y - d.h + 8, 40);
      },
    },
    drone: {
      layer: 'front', pad: 120,
      draw(g, d, t) { // patrol drone with scanning cone
        const x = d.x + Math.sin(t * 0.4 + d.seed) * d.w, y = d.y + Math.sin(t * 1.7 + d.seed) * 8;
        g.fillStyle(NEON.cyan, 0.07).fillTriangle(x, y + 6, x - 46, y + 150, x + 46, y + 150);
        g.fillStyle(0x0a0d26, 1).fillRoundedRect(x - 16, y - 6, 32, 12, 4);
        g.fillStyle(NEON.mag, 1).fillRect(x - 3, y - 2, 6, 4);
        g.fillStyle(0x2a3270, 1).fillRect(x - 26, y - 8, 14, 3).fillRect(x + 12, y - 8, 14, 3);
        g.fillStyle(0xffffff, 0.4).fillRect(x - 26, y - 9, 14, 1).fillRect(x + 12, y - 9, 14, 1);
      },
    },
  },

  ambient(scene): AmbientParticles {
    const g = scene.add.graphics().setDepth(68);
    return {
      update(_dt, view, t) {
        g.clear();
        const W = view.width, H = view.height, N = 80;
        g.lineStyle(1.4, 0xaee8ff, 0.30);
        g.beginPath();
        for (let i = 0; i < N; i++) {
          const px = view.left + (((hash(i) * W - t * 140) % W) + W) % W;
          const py = view.top + (((hash(i + 99) * H + t * (800 + hash(i + 7) * 400)) % H) + H) % H;
          g.moveTo(px, py); g.lineTo(px + 4, py + 22);
        }
        g.strokePath();
        // ripples on the wet street
        if (view.bottom > GROUND_Y - 40) {
          for (let i = 0; i < 9; i++) {
            const u = ((t * 0.9 + hash(i * 3)) % 1);
            const rx = view.left + hash(i * 11 + Math.floor(t * 0.9 + hash(i * 3))) * W;
            g.lineStyle(1.5, 0xaee8ff, 0.5 * (1 - u)).strokeEllipse(rx, GROUND_Y + 6, 6 + u * 28, 2 + u * 6);
          }
        }
      },
    };
  },
};

