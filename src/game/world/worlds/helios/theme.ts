import type Phaser from 'phaser';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, hash, mulberry32, vgrad, wrapX } from '../../kit';

type Ctx = CanvasRenderingContext2D;
type G = Phaser.GameObjects.Graphics;

export const HEL = {
  hull: 0x5d6b82, hullDark: 0x262e42, hullLight: 0xa7b6cf, neon: 0x56e0ff, mag: 0xff4fd8, amber: 0xffb347, ink: 0x05070f,
} as const;

/* ------------------------------------------------------------------ backdrop */

function farPlanet(c: Ctx, w: number, h: number): void {
  const r = mulberry32(90);
  // a gas giant filling the horizon
  const cx = w * 0.55, cy = h + 380, R = 640;
  const atm = c.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.12);
  atm.addColorStop(0, 'rgba(86,224,255,0.55)'); atm.addColorStop(1, 'rgba(86,224,255,0)');
  c.fillStyle = atm; c.beginPath(); c.arc(cx, cy, R * 1.12, 0, 7); c.fill();
  const body = c.createLinearGradient(0, cy - R, 0, cy);
  body.addColorStop(0, '#2c4a8c'); body.addColorStop(0.5, '#13255a'); body.addColorStop(1, '#070c26');
  c.fillStyle = body; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
  for (let i = 0; i < 10; i++) { c.fillStyle = `rgba(${120 + r() * 100},${150 + r() * 80},255,${0.05 + r() * 0.08})`; c.fillRect(0, cy - R + 20 + i * 36 + r() * 12, w, 10 + r() * 18); }
  c.restore();
  // station ring arc across the sky
  c.strokeStyle = 'rgba(167,182,207,0.5)'; c.lineWidth = 10; c.beginPath(); c.arc(w * 0.2, h + 900, 1080, Math.PI * 1.15, Math.PI * 1.55); c.stroke();
  c.strokeStyle = 'rgba(86,224,255,0.4)'; c.lineWidth = 3; c.stroke();
}

function midStructures(c: Ctx, w: number, h: number): void {
  const r = mulberry32(7);
  for (let x = 30; x < w; x += 240 + r() * 220) {
    const k = r(), bw = 120 + r() * 120, bh = 120 + r() * 200;
    wrapX(w, x, bw + 140, (ox) => {
      c.fillStyle = '#10172a';
      if (k < 0.45) { // docking module
        c.fillRect(ox, h - bh, bw, bh); c.fillRect(ox - 20, h - bh + 20, 20, bh * 0.5); c.fillRect(ox + bw, h - bh + 20, 20, bh * 0.5);
        c.fillStyle = 'rgba(86,224,255,0.75)'; for (let i = 0; i < 4; i++) for (let j = 0; j < Math.floor(bh / 46); j++) if (r() > 0.3) c.fillRect(ox + 14 + i * Math.floor(bw / 4.5), h - bh + 14 + j * 40, 10, 16);
      } else if (k < 0.75) { // solar array
        c.fillRect(ox + bw / 2 - 4, h - bh, 8, bh); c.fillStyle = '#1a2a5a';
        c.fillRect(ox - 40, h - bh, 100, 12); c.fillRect(ox + bw - 60, h - bh, 100, 12);
        c.fillStyle = 'rgba(86,224,255,0.35)'; for (let i = 0; i < 5; i++) { c.fillRect(ox - 38 + i * 20, h - bh + 2, 2, 8); c.fillRect(ox + bw - 58 + i * 20, h - bh + 2, 2, 8); }
      } else { // antenna mast
        c.fillRect(ox + 30, h - bh - 60, 6, bh + 60); c.fillRect(ox + 8, h - bh, 50, 4); c.fillStyle = '#ff4fd8'; c.fillRect(ox + 28, h - bh - 70, 10, 8);
      }
    });
  }
  vgrad(c, 0, h - 50, w, 50, [[0, 'rgba(30,50,110,0)'], [1, 'rgba(30,50,110,0.55)']]);
}

function nearTruss(c: Ctx, w: number, h: number): void {
  const r = mulberry32(61);
  c.strokeStyle = '#03050c'; c.fillStyle = '#03050c'; c.lineWidth = 7;
  for (let x = 70; x < w; x += 380 + r() * 300) {
    const th = 260 + r() * 260;
    wrapX(w, x - 120, 260, (ox) => {
      c.fillRect(ox, h - th, 14, th); c.fillRect(ox + 120, h - th, 14, th); c.fillRect(ox - 10, h - th - 10, 154, 14);
      c.lineWidth = 5; c.beginPath(); c.moveTo(ox + 14, h - th); c.lineTo(ox + 120, h - th * 0.5); c.lineTo(ox + 14, h); c.moveTo(ox + 120, h - th); c.lineTo(ox + 14, h - th * 0.5); c.lineTo(ox + 120, h); c.stroke();
    });
  }
}

const art: BackdropArt = {
  sky: [[0, '#01020a'], [0.6, '#070d2a'], [1, '#14215a']],
  far: { w: 2048, h: 520, draw: farPlanet },
  mid: { w: 2048, h: 420, draw: midStructures },
  near: { w: 2048, h: 640, draw: nearTruss },
};

function backdropFx(g: G, f: BackdropFrame): void {
  const { w, h, zoom, t } = f;
  g.clear();
  for (let i = 0; i < 70; i++) { // stars, with a faint parallax
    const sx = ((hash(i) * w * 1.6 - f.midX * (0.01 + hash(i + 3) * 0.02) * zoom) % w + w) % w, sy = hash(i + 9) * h * 0.62;
    g.fillStyle(0xffffff, 0.3 + 0.7 * Math.abs(Math.sin(t * (0.5 + hash(i + 4)) + i))).fillRect(sx, sy, (1 + hash(i + 2) * 1.6) * zoom, (1 + hash(i + 2) * 1.6) * zoom);
  }
  const m = (t * 0.25) % 6; // a meteor now and then
  if (m < 0.5) { const mx = w * (0.1 + 0.8 * hash(Math.floor(t / 6))) + m * 600 * zoom, my = h * 0.1 + m * 220 * zoom; g.lineStyle(2 * zoom, 0xcfe8ff, 1 - m * 2).lineBetween(mx, my, mx - 90 * zoom, my - 33 * zoom); }
  const sat = ((t * 14) % (w + 200 * zoom)) - 100 * zoom;
  g.fillStyle(0xa7b6cf, 0.9).fillRect(sat, h * 0.2, 8 * zoom, 4 * zoom).fillStyle(0x56e0ff, 0.8).fillRect(sat - 6 * zoom, h * 0.2 + zoom, 5 * zoom, 2 * zoom);
}

/* ------------------------------------------------------------------ helpers */

function plates(g: G, x: number, y: number, w: number, h: number, base: number, seed: number): void {
  g.fillStyle(base, 1).fillRect(x, y, w, h);
  g.lineStyle(2, HEL.ink, 0.5);
  for (let xx = x + 100; xx < x + w; xx += 100) g.lineBetween(xx, y, xx, y + h);
  for (let yy = y + 56; yy < y + h; yy += 56) g.lineBetween(x, yy, x + w, yy);
  g.fillStyle(HEL.ink, 0.5);
  for (let xx = x + 8; xx < x + w; xx += 100) for (let yy = y + 8; yy < y + h; yy += 56) g.fillCircle(xx, yy, 2);
  g.fillStyle(0xffffff, 0.05).fillRect(x, y, w, 6);
  void seed;
}

function lightStrip(g: G, x: number, y: number, w: number, col: number, a = 0.9): void {
  g.fillStyle(col, a * 0.3).fillRect(x, y - 3, w, 9).fillStyle(col, a).fillRect(x, y, w, 3);
}

/* ------------------------------------------------------------------ theme */

export const heliosTheme: WorldTheme = {
  id: 'helios',
  accent: HEL.neon,
  backdrop: art,
  backdropFx,

  drawSolid(g, s) {
    switch (s.kind) {
      case 'ground': {
        plates(g, s.x, s.y, s.w, s.h, HEL.hull, s.x);
        g.fillStyle(HEL.hullDark, 1).fillRect(s.x, s.y, s.w, 10);
        lightStrip(g, s.x, s.y + 4, s.w, HEL.neon, 0.9);
        for (let xx = s.x + 40; xx < s.x + s.w; xx += 200) g.fillStyle(HEL.amber, 0.8).fillRect(xx, s.y + 24, 60, 4);
        break;
      }
      case 'roof': {
        plates(g, s.x, s.y, s.w, s.h, HEL.hullLight, s.x);
        lightStrip(g, s.x, s.y + 2, s.w, HEL.mag, 0.9);
        g.fillStyle(HEL.hullDark, 1).fillRect(s.x, s.y + s.h - 6, s.w, 6);
        break;
      }
      case 'crate': { // cargo container with hazard chevrons
        g.fillStyle(0x3a4a6a, 1).fillRect(s.x, s.y, s.w, s.h);
        g.lineStyle(2, HEL.ink, 0.6);
        for (let xx = s.x + 14; xx < s.x + s.w; xx += 14) g.lineBetween(xx, s.y, xx, s.y + s.h);
        g.fillStyle(HEL.amber, 1);
        for (let xx = s.x; xx < s.x + s.w - 10; xx += 24) g.fillTriangle(xx, s.y + 12, xx + 12, s.y, xx + 24, s.y + 12);
        g.lineStyle(3, HEL.neon, 0.8).strokeRect(s.x, s.y, s.w, s.h);
        break;
      }
      case 'gate': { plates(g, s.x, s.y, s.w, s.h, HEL.hullDark, s.x); g.fillStyle(HEL.mag, 0.9).fillRect(s.x, s.y + s.h * 0.45, s.w, 8); break; }
      default: { plates(g, s.x, s.y, s.w, s.h, HEL.hullDark, s.x); lightStrip(g, s.x, s.y + 20, s.w, HEL.neon, 0.5); }
    }
  },

  drawLedge(g, o) { // hover pad
    g.fillStyle(HEL.hullDark, 1).fillRect(o.x, o.y, o.w, 8);
    lightStrip(g, o.x, o.y + 1, o.w, HEL.neon, 1);
    g.fillStyle(HEL.neon, 0.15).fillTriangle(o.x + 10, o.y + 8, o.x + o.w - 10, o.y + 8, o.x + o.w / 2, o.y + 44);
    g.fillStyle(HEL.hullLight, 1).fillRect(o.x + 6, o.y - 3, 10, 4).fillRect(o.x + o.w - 16, o.y - 3, 10, 4);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'module': {
        plates(g, d.x, d.y, d.w, d.h, 0x34415c, d.seed);
        g.fillStyle(0x060a1c, 1);
        for (let xx = d.x + 30; xx < d.x + d.w - 40; xx += 90) for (let yy = d.y + 30; yy < d.y + d.h - 50; yy += 80) g.fillRect(xx, yy, 56, 40).lineStyle(2, HEL.neon, 0.6).strokeRect(xx, yy, 56, 40);
        lightStrip(g, d.x, d.y + 8, d.w, HEL.neon, 0.7);
        break;
      }
      case 'viewport': { // a wide window onto space and the planet
        g.fillStyle(HEL.hullDark, 1).fillRect(d.x - 14, d.y - 14, d.w + 28, d.h + 28);
        g.fillStyle(0x03050f, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x1a3a8c, 1).fillCircle(d.x + d.w * 0.7, d.y + d.h * 1.4, d.h * 1.1);
        g.fillStyle(0xffffff, 0.8);
        for (let i = 0; i < 18; i++) g.fillRect(d.x + hash(d.seed + i) * d.w, d.y + hash(d.seed + i + 7) * d.h * 0.7, 2, 2);
        g.lineStyle(4, HEL.hullLight, 1).strokeRect(d.x, d.y, d.w, d.h).lineBetween(d.x + d.w / 2, d.y, d.x + d.w / 2, d.y + d.h);
        break;
      }
      case 'pylon': g.fillStyle(HEL.hullDark, 1).fillRect(d.x, d.y, d.w, d.h).fillRect(d.x - 14, d.y, d.w + 28, 14).fillRect(d.x - 14, d.y + d.h - 14, d.w + 28, 14); lightStrip(g, d.x + d.w / 2 - 2, d.y + 20, 4, HEL.mag, 0.8); g.fillRect(d.x + d.w / 2 - 2, d.y + 20, 4, d.h - 40); break;
      case 'solar': {
        g.fillStyle(HEL.hullLight, 1).fillRect(d.x + d.w / 2 - 4, d.y + d.h * 0.4, 8, d.h * 0.6);
        g.fillStyle(0x16286a, 1).fillRect(d.x, d.y, d.w, d.h * 0.4).lineStyle(2, HEL.neon, 0.5);
        for (let xx = d.x; xx < d.x + d.w; xx += 24) g.lineBetween(xx, d.y, xx, d.y + d.h * 0.4);
        g.lineBetween(d.x, d.y + d.h * 0.2, d.x + d.w, d.y + d.h * 0.2);
        break;
      }
      case 'console': g.fillStyle(0x303c58, 1).fillRect(d.x, d.y, d.w, d.h).fillStyle(0x060a1c, 1).fillRect(d.x + 6, d.y + 6, d.w - 12, d.h * 0.5); lightStrip(g, d.x + 6, d.y + d.h - 10, d.w - 12, HEL.amber, 0.8); break;
      case 'holo': g.fillStyle(HEL.hullDark, 1).fillRect(d.x - 20, d.y - 8, 40, 8).fillStyle(HEL.neon, 0.9).fillRect(d.x - 14, d.y - 10, 28, 3); break;
      case 'beacon': g.fillStyle(HEL.hullDark, 1).fillRect(d.x - 4, d.y - d.h, 8, d.h).fillStyle(HEL.hullLight, 1).fillRect(d.x - 10, d.y - d.h - 6, 20, 8); break;
      case 'pod': g.fillStyle(0x8a98b2, 1).fillEllipse(d.x + d.w / 2, d.y + d.h / 2, d.w, d.h).fillStyle(0x060a1c, 1).fillEllipse(d.x + d.w * 0.65, d.y + d.h * 0.42, d.w * 0.3, d.h * 0.34).fillStyle(HEL.amber, 1).fillRect(d.x + 8, d.y + d.h * 0.5, d.w * 0.3, 4); break;
      case 'cable': { // hanging cables over the actors
        g.lineStyle(5, 0x03050c, 0.95);
        for (let i = 0; i < 3; i++) { const cx = d.x + i * 22; g.beginPath().moveTo(cx, d.y).lineTo(cx + (hash(d.seed + i) - 0.5) * 30, d.y + d.h * 0.6).lineTo(cx + (hash(d.seed + i + 3) - 0.5) * 20, d.y + d.h).strokePath(); g.fillStyle(HEL.neon, 0.9).fillCircle(cx, d.y + d.h * 0.6, 3); }
        break;
      }
      case 'sign': {
        g.fillStyle(HEL.hullDark, 1).fillRect(d.x + 10, d.y + d.h, 6, 60).fillRect(d.x + d.w - 16, d.y + d.h, 6, 60);
        g.fillStyle(0x060a1c, 1).fillRect(d.x, d.y, d.w, d.h).lineStyle(2, HEL.neon, 1).strokeRect(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
        ctx.text(d, 0x9ff0ff);
        break;
      }
      case 'door': { // airlock
        g.fillStyle(0x060a1c, 1).fillRect(d.x, d.y, d.w, d.h).lineStyle(4, HEL.hullLight, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(HEL.amber, 1); for (let yy = d.y; yy < d.y + d.h; yy += 28) g.fillRect(d.x - 10, yy, 10, 14).fillRect(d.x + d.w, yy, 10, 14);
        g.fillStyle(HEL.neon, 0.16).fillRect(d.x, d.y, d.w, d.h);
        if (d.text) ctx.text({ ...d, y: d.y - 34, h: 24 }, 0x9ff0ff);
        break;
      }
      default: break;
    }
  },

  animated: {
    holo: {
      layer: 'back', pad: 90,
      draw(g, d, t) { // a rotating wireframe hologram above its projector
        const a = t * 1.4 + d.seed, k = 0.7 + 0.3 * Math.sin(t * 6);
        g.lineStyle(2, HEL.neon, 0.9 * k);
        const cx = d.x, cy = d.y - 50;
        for (let i = 0; i < 4; i++) { const ang = a + i * Math.PI / 2; g.lineBetween(cx + Math.cos(ang) * 26, cy + 20, cx + Math.cos(ang + Math.PI / 2) * 26, cy + 20).lineBetween(cx + Math.cos(ang) * 26, cy + 20, cx, cy - 26); }
        g.fillStyle(HEL.neon, 0.08).fillTriangle(cx - 20, d.y - 10, cx + 20, d.y - 10, cx, cy - 30);
      },
    },
    console: {
      layer: 'back', pad: 20,
      draw(g, d, t) { g.fillStyle(HEL.neon, 0.5 + 0.3 * Math.sin(t * 3 + d.seed)); for (let i = 0; i < 4; i++) g.fillRect(d.x + 10, d.y + 10 + i * (d.h * 0.12), (d.w - 20) * (0.3 + 0.6 * Math.abs(Math.sin(t * 1.3 + i + d.seed))), 3); },
    },
    beacon: {
      layer: 'back', pad: 80,
      draw(g, d, t) { const on = Math.sin(t * 4 + d.seed) > 0; g.fillStyle(HEL.mag, on ? 0.9 : 0.2).fillCircle(d.x, d.y - d.h - 10, 5); if (on) g.fillStyle(HEL.mag, 0.2).fillCircle(d.x, d.y - d.h - 10, 40); },
    },
    pylon: {
      layer: 'back', pad: 30,
      draw(g, d, t) { for (let i = 0; i < 5; i++) { const u = (t * 0.7 + i / 5) % 1; g.fillStyle(HEL.mag, 0.9 * (1 - Math.abs(u - 0.5) * 2)).fillRect(d.x + d.w / 2 - 2, d.y + 20 + u * (d.h - 44), 4, 8); } },
    },
    conveyor: {
      layer: 'back', pad: 20,
      draw(g, d, t) { // chevrons sliding along the travelator
        const dir = d.h >= 0 ? 1 : -1;
        g.fillStyle(HEL.amber, 0.85);
        for (let xx = 0; xx < d.w; xx += 60) { const x = d.x + ((xx + t * 110 * dir) % d.w + d.w) % d.w; g.fillTriangle(x, GROUND_Y - 6, x + 14 * dir, GROUND_Y - 1, x, GROUND_Y + 4); }
        g.fillStyle(HEL.neon, 0.35).fillRect(d.x, GROUND_Y + 6, d.w, 3);
      },
    },
    module: {
      layer: 'back', pad: 20,
      draw(g, d, t) { if (Math.sin(t * 0.8 + d.seed) > 0.7) g.fillStyle(HEL.neon, 0.25).fillRect(d.x + 30, d.y + 30, 56, 40); },
    },
  },

  ambient(scene): AmbientParticles {
    const g = scene.add.graphics().setDepth(67);
    return {
      update(_dt, view, t) { // drifting dust and the occasional spark from a damaged conduit
        g.clear();
        g.fillStyle(0xcfe8ff, 0.35);
        for (let i = 0; i < 30; i++) g.fillRect(view.left + ((hash(i) * view.width + t * (6 + hash(i + 4) * 14)) % view.width), view.top + hash(i + 8) * view.height + Math.sin(t * 0.6 + i) * 10, 2, 2);
        if (hash(Math.floor(t * 2)) > 0.8) { const sx = view.left + hash(Math.floor(t * 2) + 3) * view.width, sy = view.top + view.height * 0.3; g.fillStyle(HEL.amber, 0.9); for (let i = 0; i < 6; i++) g.fillRect(sx + (hash(i) - 0.5) * 30, sy + hash(i + 2) * 40 * ((t * 2) % 1), 2, 2); }
        g.lineStyle(1, HEL.neon, 0.035); for (let y = view.top; y < view.bottom; y += 6) g.lineBetween(view.left, y, view.right, y);
      },
    };
  },
};
