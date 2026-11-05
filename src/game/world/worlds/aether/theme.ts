import type Phaser from 'phaser';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, hash, mulberry32, vgrad, wrapX } from '../../kit';

type Ctx = CanvasRenderingContext2D;
type G = Phaser.GameObjects.Graphics;

export const AET = {
  cloud: 0xffffff, marble: 0xf1ead8, marbleDark: 0xc9bfa6, gold: 0xf0c05a, sky: 0x5aa9ff, rose: 0xff9ec0, storm: 0x5a4aa8, bolt: 0xfff6a0, ink: 0x1b2748, grass: 0x7fd36a,
} as const;

/* ------------------------------------------------------------------ backdrop */

function farIslands(c: Ctx, w: number, h: number): void {
  const r = mulberry32(2025);
  // the sun low on the horizon and a sea of clouds
  const sx = w * 0.35, sy = h - 260;
  const g = c.createRadialGradient(sx, sy, 10, sx, sy, 360);
  g.addColorStop(0, 'rgba(255,248,210,1)'); g.addColorStop(0.2, 'rgba(255,214,150,0.6)'); g.addColorStop(1, 'rgba(255,214,150,0)');
  c.fillStyle = g; c.fillRect(sx - 360, sy - 360, 720, 720);
  // great floating islands with waterfalls
  for (let i = 0; i < 5; i++) {
    const ix = (i + 0.3) * (w / 5) + r() * 80, iy = h - 330 - r() * 190, iw = 200 + r() * 200, ih = 60 + r() * 50;
    wrapX(w, ix - iw / 2, iw + 40, (ox) => {
      c.fillStyle = '#6a8fc0'; c.beginPath(); c.moveTo(ox, iy); c.lineTo(ox + iw, iy); c.lineTo(ox + iw * 0.7, iy + ih * 1.8); c.lineTo(ox + iw * 0.5, iy + ih * 2.6); c.lineTo(ox + iw * 0.3, iy + ih * 1.6); c.closePath(); c.fill();
      c.fillStyle = '#9fd48a'; c.fillRect(ox, iy - 8, iw, 12);
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(ox + iw * 0.45, iy + 4, 8, ih * 2);
      c.fillStyle = '#e8e0cc'; c.fillRect(ox + iw * 0.3, iy - 56, 22, 50); c.beginPath(); c.moveTo(ox + iw * 0.3 - 4, iy - 56); c.lineTo(ox + iw * 0.3 + 11, iy - 84); c.lineTo(ox + iw * 0.3 + 26, iy - 56); c.fill();
    });
  }
  c.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 34; i++) { const cx = r() * w, cy = h - 40 - r() * 100, rad = 60 + r() * 110; wrapX(w, cx - rad, rad * 2, (ox) => { c.beginPath(); c.arc(ox + rad, cy, rad, 0, 7); c.fill(); }); }
}

function midTowers(c: Ctx, w: number, h: number): void {
  const r = mulberry32(44);
  for (let x = 40; x < w; x += 230 + r() * 200) {
    const th = 160 + r() * 260, tw = 56 + r() * 36;
    wrapX(w, x, tw + 80, (ox) => {
      c.fillStyle = 'rgba(240,232,214,0.95)'; c.fillRect(ox, h - th, tw, th);
      c.fillStyle = '#f0c05a'; c.beginPath(); c.arc(ox + tw / 2, h - th, tw * 0.62, Math.PI, 0); c.fill(); c.fillRect(ox + tw / 2 - 2, h - th - tw * 0.62 - 24, 4, 24);
      c.fillStyle = 'rgba(90,169,255,0.7)'; for (let j = 0; j < Math.floor(th / 50); j++) c.fillRect(ox + tw / 2 - 5, h - th + 20 + j * 46, 10, 20);
      c.fillStyle = 'rgba(240,232,214,0.9)'; c.fillRect(ox - 30, h - th * 0.45, 30, 8);
    });
  }
  c.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 20; i++) { const cx = r() * w, rad = 40 + r() * 70; wrapX(w, cx - rad, rad * 2, (ox) => { c.beginPath(); c.arc(ox + rad, h - 10, rad, 0, 7); c.fill(); }); }
}

function nearWisps(c: Ctx, w: number, h: number): void {
  const r = mulberry32(8);
  for (let i = 0; i < 16; i++) {
    const cx = r() * w, cy = h - r() * 260, rw = 120 + r() * 220;
    wrapX(w, cx - rw, rw * 2, (ox) => { c.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.25})`; c.beginPath(); c.ellipse(ox + rw, cy, rw, 16 + r() * 18, 0, 0, 7); c.fill(); });
  }
  c.strokeStyle = 'rgba(90,70,160,0.85)'; c.lineWidth = 3;
  for (let x = 140; x < w; x += 520 + r() * 320) wrapX(w, x, 30, (ox) => { c.beginPath(); c.moveTo(ox, h); c.lineTo(ox + 8, h - 160 - r() * 140); c.stroke(); c.fillStyle = 'rgba(90,70,160,0.85)'; c.beginPath(); c.arc(ox + 8, h - 170, 8, 0, 7); c.fill(); });
}

const art: BackdropArt = {
  sky: [[0, '#2c64cc'], [0.45, '#7fb8f0'], [0.8, '#ffd6a8'], [1, '#fff0cf']],
  far: { w: 2048, h: 540, draw: farIslands },
  mid: { w: 2048, h: 420, draw: midTowers },
  near: { w: 2048, h: 560, draw: nearWisps },
};

function backdropFx(g: G, f: BackdropFrame): void {
  const { w, h, zoom, t } = f;
  g.clear();
  for (let i = 0; i < 5; i++) { // sun rays through the cloud deck
    const x = ((hash(i) * w * 1.2 - f.midX * 0.03 * zoom) % w + w) % w, a = 0.04 + 0.02 * Math.sin(t * 0.6 + i);
    g.fillStyle(0xfff3c4, a).fillTriangle(x, h * 0.25, x + 40 * zoom, h * 0.25, x - 160 * zoom + Math.sin(t * 0.3 + i) * 20 * zoom, h).fillTriangle(x, h * 0.25, x + 40 * zoom, h * 0.25, x + 220 * zoom, h);
  }
  for (let i = 0; i < 6; i++) { // birds
    const bx = ((hash(i + 30) * w + t * (46 + i * 9) * zoom) % (w + 200 * zoom)) - 100 * zoom, by = h * (0.14 + 0.2 * hash(i)) + Math.sin(t * 1.4 + i) * 14 * zoom, fl = Math.sin(t * 8 + i) * 4 * zoom;
    g.lineStyle(2 * zoom, 0x2a3a6a, 0.9).beginPath().moveTo(bx - 8 * zoom, by - fl).lineTo(bx, by).lineTo(bx + 8 * zoom, by - fl).strokePath();
  }
  for (let i = 0; i < 3; i++) { const cx = ((hash(i + 12) * w * 1.3 + t * (12 + i * 5) * zoom) % (w * 1.3)) - w * 0.15; g.fillStyle(0xffffff, 0.5).fillEllipse(cx, f.sy(0.12, 0.88, 110 + i * 40), 520 * zoom, 56 * zoom); }
}

/* ------------------------------------------------------------------ helpers */

function marble(g: G, x: number, y: number, w: number, h: number, base: number, seed: number): void {
  g.fillStyle(base, 1).fillRect(x, y, w, h);
  g.lineStyle(2, AET.marbleDark, 0.7);
  for (let yy = y + 40; yy < y + h; yy += 40) g.lineBetween(x, yy, x + w, yy);
  for (let xx = x + 90; xx < x + w; xx += 90) g.lineBetween(xx, y, xx, y + h);
  g.lineStyle(1, AET.sky, 0.35);
  for (let i = 0; i < w / 90; i++) g.lineBetween(x + i * 90 + hash(seed + i) * 60, y, x + i * 90 + hash(seed + i) * 60 + 22, y + h);
  g.fillStyle(0xffffff, 0.5).fillRect(x, y, w, 4);
}

function puffs(g: G, x: number, y: number, w: number, seed: number, a = 1): void {
  g.fillStyle(AET.cloud, a);
  for (let xx = x; xx < x + w; xx += 22) g.fillCircle(xx + 10, y - 2 + hash(seed + xx) * 6, 14 + hash(seed + xx + 1) * 10);
}

/* ------------------------------------------------------------------ theme */

export const aetherTheme: WorldTheme = {
  id: 'aether',
  accent: AET.gold,
  backdrop: art,
  backdropFx,

  drawSolid(g, s) {
    switch (s.kind) {
      case 'ground': { // a floor of marble-flecked cloud
        g.fillStyle(0xe6edf8, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0xcfd9ee, 1).fillRect(s.x, s.y + 36, s.w, s.h - 36);
        g.fillStyle(AET.gold, 1).fillRect(s.x, s.y + 22, s.w, 4);
        marble(g, s.x, s.y + 28, s.w, 8, AET.marble, s.x);
        puffs(g, s.x, s.y, s.w, s.x);
        break;
      }
      case 'roof': { // a floating island with a turf top and a rocky underside
        g.fillStyle(0x6a8fb0, 1).fillTriangle(s.x + 10, s.y + s.h, s.x + s.w - 10, s.y + s.h, s.x + s.w / 2, s.y + s.h + Math.min(110, s.w * 0.22));
        g.fillStyle(0x56789a, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(AET.grass, 1).fillRect(s.x, s.y, s.w, 9);
        g.fillStyle(0x5db04e, 1); for (let xx = s.x + 6; xx < s.x + s.w; xx += 26) g.fillTriangle(xx, s.y + 9, xx + 8, s.y + 9, xx + 4, s.y + 16 + hash(xx) * 8);
        g.fillStyle(AET.marble, 1); for (let xx = s.x + 30; xx < s.x + s.w - 40; xx += 150) g.fillRect(xx, s.y - 16, 26, 16);
        break;
      }
      case 'crate': { marble(g, s.x, s.y, s.w, s.h, AET.marble, s.x); g.lineStyle(3, AET.gold, 1).strokeRect(s.x, s.y, s.w, s.h); break; }
      case 'gate': { marble(g, s.x, s.y, s.w, s.h, AET.marbleDark, s.x); g.fillStyle(AET.gold, 1).fillRect(s.x, s.y + s.h * 0.4, s.w, 12); break; }
      default: marble(g, s.x, s.y, s.w, s.h, AET.marbleDark, s.x);
    }
  },

  drawLedge(g, o) { // a solid-looking cloud step
    puffs(g, o.x - 6, o.y + 6, o.w + 12, o.x, 1);
    g.fillStyle(0xdbe6f6, 1).fillRect(o.x, o.y + 4, o.w, 10);
    g.fillStyle(0xffffff, 0.8).fillRect(o.x, o.y, o.w, 3);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'spire': {
        marble(g, d.x, d.y, d.w, d.h, AET.marble, d.seed);
        g.fillStyle(AET.gold, 1).fillEllipse(d.x + d.w / 2, d.y, d.w * 1.2, d.w * 1.2).fillRect(d.x + d.w / 2 - 3, d.y - d.w * 0.6 - 26, 6, 28).fillCircle(d.x + d.w / 2, d.y - d.w * 0.6 - 28, 7);
        g.fillStyle(AET.sky, 0.7); for (let yy = d.y + 40; yy < d.y + d.h - 60; yy += 80) g.fillRect(d.x + d.w / 2 - 9, yy, 18, 34).fillEllipse(d.x + d.w / 2, yy, 18, 18);
        break;
      }
      case 'isle': {
        g.fillStyle(0x6a8fb0, 1).fillTriangle(d.x, d.y, d.x + d.w, d.y, d.x + d.w / 2, d.y + d.h).fillStyle(0x56789a, 1).fillTriangle(d.x + d.w / 2, d.y, d.x + d.w, d.y, d.x + d.w / 2, d.y + d.h);
        g.fillStyle(AET.grass, 1).fillRect(d.x, d.y - 8, d.w, 12);
        g.fillStyle(0xffffff, 0.7).fillRect(d.x + d.w * 0.46, d.y + 6, 8, d.h * 0.6);
        break;
      }
      case 'windmill': g.fillStyle(AET.marble, 1).fillTriangle(d.x, d.y + d.h, d.x + d.w, d.y + d.h, d.x + d.w / 2, d.y + d.h * 0.3).fillRect(d.x + d.w * 0.2, d.y + d.h * 0.5, d.w * 0.6, d.h * 0.5).fillStyle(AET.gold, 1).fillCircle(d.x + d.w / 2, d.y + d.h * 0.3, 8); break;
      case 'statue': { // winged guardian
        g.fillStyle(AET.marble, 1).fillRect(d.x + d.w * 0.3, d.y + d.h * 0.25, d.w * 0.4, d.h * 0.75).fillCircle(d.x + d.w / 2, d.y + d.h * 0.18, d.w * 0.14);
        g.fillStyle(AET.marbleDark, 1).fillRect(d.x + d.w * 0.15, d.y + d.h * 0.88, d.w * 0.7, d.h * 0.12);
        g.fillStyle(0xffffff, 1).fillTriangle(d.x + d.w * 0.3, d.y + d.h * 0.3, d.x - d.w * 0.2, d.y + d.h * 0.1, d.x + d.w * 0.15, d.y + d.h * 0.7).fillTriangle(d.x + d.w * 0.7, d.y + d.h * 0.3, d.x + d.w * 1.2, d.y + d.h * 0.1, d.x + d.w * 0.85, d.y + d.h * 0.7);
        g.fillStyle(AET.gold, 1).fillRect(d.x + d.w * 0.36, d.y + d.h * 0.06, d.w * 0.28, 4);
        break;
      }
      case 'column': g.fillStyle(AET.marble, 1).fillRect(d.x, d.y, d.w, d.h).fillStyle(AET.gold, 1).fillRect(d.x - 8, d.y - 12, d.w + 16, 14).fillRect(d.x - 8, d.y + d.h - 12, d.w + 16, 14); g.lineStyle(2, AET.marbleDark, 0.8); for (let x = d.x + 10; x < d.x + d.w; x += 14) g.lineBetween(x, d.y, x, d.y + d.h); break;
      case 'fountain': g.fillStyle(AET.marble, 1).fillRect(d.x, d.y + d.h * 0.6, d.w, d.h * 0.4).fillRect(d.x + d.w * 0.4, d.y + d.h * 0.2, d.w * 0.2, d.h * 0.5).fillStyle(AET.sky, 0.8).fillEllipse(d.x + d.w / 2, d.y + d.h * 0.6, d.w, 16); break;
      case 'banner': g.fillStyle(AET.gold, 1).fillRect(d.x + d.w / 2 - 2, d.y, 4, d.h + 40); break;
      case 'lantern': g.fillStyle(AET.gold, 1).fillRect(d.x - 3, d.y - d.h, 6, d.h).fillRect(d.x - 10, d.y - d.h - 6, 20, 8).fillStyle(AET.marble, 1).fillRect(d.x - 7, d.y - d.h - 28, 14, 22); break;
      case 'streak': break;
      case 'sign': {
        g.fillStyle(AET.gold, 1).fillRect(d.x + 10, d.y + d.h, 6, 60).fillRect(d.x + d.w - 16, d.y + d.h, 6, 60);
        g.fillStyle(AET.marble, 1).fillRect(d.x, d.y, d.w, d.h).lineStyle(3, AET.gold, 1).strokeRect(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
        ctx.text(d, 0x3a3a6a);
        break;
      }
      case 'door': { // a gate of light
        g.fillStyle(0xfff6d0, 1).fillRect(d.x, d.y, d.w, d.h).fillEllipse(d.x + d.w / 2, d.y, d.w, 50);
        g.lineStyle(5, AET.gold, 1).strokeRect(d.x, d.y, d.w, d.h).strokeEllipse(d.x + d.w / 2, d.y, d.w, 50);
        g.fillStyle(AET.sky, 0.2).fillRect(d.x, d.y, d.w, d.h);
        if (d.text) ctx.text({ ...d, y: d.y - 46, h: 24 }, 0x3a3a6a);
        break;
      }
      default: break;
    }
  },

  animated: {
    windmill: {
      layer: 'back', pad: 120,
      draw(g, d, t) { const cx = d.x + d.w / 2, cy = d.y + d.h * 0.3; for (let i = 0; i < 4; i++) { const a = t * 0.9 + (i * Math.PI) / 2 + d.seed; g.fillStyle(0xffffff, 0.95).fillTriangle(cx, cy, cx + Math.cos(a) * 78 - Math.sin(a) * 11, cy + Math.sin(a) * 78 + Math.cos(a) * 11, cx + Math.cos(a) * 78 + Math.sin(a) * 11, cy + Math.sin(a) * 78 - Math.cos(a) * 11); } },
    },
    banner: {
      layer: 'back', pad: 90,
      draw(g, d, t) {
        const x0 = d.x + d.w / 2 + 2;
        g.fillStyle(0xff9ec0, 1).beginPath().moveTo(x0, d.y + 4);
        for (let i = 0; i <= 8; i++) g.lineTo(x0 + i * 9, d.y + 4 + Math.sin(t * 5 + i * 0.7) * (2 + i * 0.9));
        for (let i = 8; i >= 0; i--) g.lineTo(x0 + i * 9, d.y + 54 + Math.sin(t * 5 + i * 0.7) * (2 + i * 0.9));
        g.closePath().fillPath().fillStyle(AET.gold, 1).fillCircle(x0 + 24, d.y + 28 + Math.sin(t * 5 + 2) * 3, 7);
      },
    },
    fountain: {
      layer: 'back', pad: 80,
      draw(g, d, t) { for (let i = 0; i < 7; i++) { const u = (t * 0.9 + i / 7) % 1, a = (i - 3) * 0.28; g.fillStyle(0xbfe6ff, 0.85 * (1 - u)).fillCircle(d.x + d.w / 2 + Math.sin(a) * u * 50, d.y + d.h * 0.2 + u * u * 70 - (1 - u) * 20, 4); } },
    },
    lantern: {
      layer: 'back', pad: 80,
      draw(g, d, t) { const k = 0.8 + 0.2 * Math.sin(t * 4 + d.seed); g.fillStyle(0xfff0a0, 0.2 * k).fillCircle(d.x, d.y - d.h - 17, 56); g.fillStyle(0xfff6c0, 0.95).fillRect(d.x - 4, d.y - d.h - 24, 8, 12); },
    },
    statue: {
      layer: 'back', pad: 60,
      draw(g, d, t) { const k = 0.5 + 0.5 * Math.sin(t * 1.4 + d.seed); g.fillStyle(0xffffff, 0.1 + 0.1 * k).fillCircle(d.x + d.w / 2, d.y + d.h * 0.4, d.w * 0.9); },
    },
    gustband: {
      layer: 'front', pad: 20,
      draw(g, d, t) { // gust lines: sign of d.h gives the direction the wind blows
        const dir = d.h >= 0 ? 1 : -1;
        g.fillStyle(0xffffff, 0.5);
        for (let i = 0; i < 20; i++) { const x = d.x + ((hash(d.seed + i) * d.w + t * 560 * dir) % d.w + d.w) % d.w; const y = GROUND_Y - 30 - hash(i + d.seed * 3) * 340; g.fillRect(x, y, 44, 2).fillCircle(x + (dir > 0 ? 44 : 0), y + 1, 3); }
      },
    },
  },

  ambient(scene): AmbientParticles {
    const g = scene.add.graphics().setDepth(67);
    return {
      update(_dt, view, t) { // feathers and wind
        g.clear();
        for (let i = 0; i < 14; i++) { const u = (t * (0.07 + hash(i) * 0.05) + hash(i + 3)) % 1, px = view.left + ((hash(i * 7) * view.width + t * 40) % view.width) + Math.sin(t * 1.5 + i) * 20; g.fillStyle(0xffffff, 0.8 * (1 - Math.abs(u - 0.5) * 1.4)).fillEllipse(px, view.top + u * view.height, 12, 4); }
        g.fillStyle(0xfff3c4, 0.04).fillRect(view.left, view.top, view.width, view.height);
      },
    };
  },
};
