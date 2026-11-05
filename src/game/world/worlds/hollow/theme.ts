import type Phaser from 'phaser';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, hash, mulberry32, vgrad, wrapX } from '../../kit';

type Ctx = CanvasRenderingContext2D;
type G = Phaser.GameObjects.Graphics;

export const HOL = {
  soil: 0x1d1426, soilLight: 0x34283f, stone: 0x4a4658, stoneDark: 0x27232f, bone: 0xe8e2d0, blood: 0xb0173a, ghost: 0x7dffb0, moon: 0xd7deff, wood: 0x2a1a22, ink: 0x07030f,
} as const;

/* ------------------------------------------------------------------ backdrop */

function farCastle(c: Ctx, w: number, h: number): void {
  const r = mulberry32(666);
  // a vast moon with a haze of cloud
  const mx = w * 0.62, my = h - 330;
  const halo = c.createRadialGradient(mx, my, 40, mx, my, 260);
  halo.addColorStop(0, 'rgba(215,222,255,0.5)'); halo.addColorStop(1, 'rgba(215,222,255,0)');
  c.fillStyle = halo; c.fillRect(mx - 260, my - 260, 520, 520);
  c.fillStyle = '#e6eaff'; c.beginPath(); c.arc(mx, my, 92, 0, 7); c.fill();
  c.fillStyle = 'rgba(120,130,170,0.35)'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(mx - 50 + r() * 100, my - 50 + r() * 100, 8 + r() * 14, 0, 7); c.fill(); }
  // the cursed castle on its crag
  c.fillStyle = '#0b0618';
  c.beginPath(); c.moveTo(w * 0.1, h); c.lineTo(w * 0.16, h - 250); c.lineTo(w * 0.28, h - 300); c.lineTo(w * 0.4, h - 220); c.lineTo(w * 0.46, h); c.fill();
  for (const [x, ww, hh] of [[0.17, 60, 260], [0.22, 90, 340], [0.28, 50, 400], [0.33, 80, 300], [0.37, 46, 360]]) {
    c.fillRect(w * x, h - 300 - hh * 0.5, ww, hh * 0.9);
    c.beginPath(); c.moveTo(w * x - 6, h - 300 - hh * 0.5); c.lineTo(w * x + ww / 2, h - 300 - hh * 0.5 - 70); c.lineTo(w * x + ww + 6, h - 300 - hh * 0.5); c.fill();
    c.fillStyle = 'rgba(190,120,255,0.8)'; c.fillRect(w * x + ww / 2 - 4, h - 300 - hh * 0.3, 8, 14); c.fillStyle = '#0b0618';
  }
  // jagged forest line
  c.fillStyle = '#0a0514';
  c.beginPath(); c.moveTo(0, h);
  for (let x = 0; x <= w; x += 20) c.lineTo(x, h - 80 - r() * 90 - (Math.sin(x * 0.01) * 0.5 + 0.5) * 60);
  c.lineTo(w, h); c.fill();
  vgrad(c, 0, h - 110, w, 110, [[0, 'rgba(120,80,150,0)'], [1, 'rgba(120,80,150,0.4)']]);
}

function midTrees(c: Ctx, w: number, h: number): void {
  const r = mulberry32(13);
  c.strokeStyle = '#0d0818'; c.fillStyle = '#0d0818';
  for (let x = 20; x < w; x += 150 + r() * 160) {
    const th = 200 + r() * 200;
    wrapX(w, x - 120, 260, (ox) => {
      c.lineWidth = 16 + r() * 10; c.beginPath(); c.moveTo(ox, h); c.quadraticCurveTo(ox - 14 + r() * 28, h - th * 0.5, ox + 6, h - th); c.stroke();
      c.lineWidth = 5;
      for (let i = 0; i < 4; i++) { const by = h - th * (0.3 + i * 0.2), dir = i % 2 ? 1 : -1; c.beginPath(); c.moveTo(ox + 2, by); c.quadraticCurveTo(ox + dir * 40, by - 30, ox + dir * (70 + r() * 60), by - 20 - r() * 40); c.stroke(); }
    });
  }
  vgrad(c, 0, h - 90, w, 90, [[0, 'rgba(110,70,140,0)'], [1, 'rgba(110,70,140,0.55)']]);
}

function nearThorns(c: Ctx, w: number, h: number): void {
  const r = mulberry32(5);
  c.strokeStyle = '#030108'; c.fillStyle = '#030108';
  for (let x = 40; x < w; x += 280 + r() * 260) {
    wrapX(w, x - 100, 220, (ox) => {
      c.lineWidth = 6; c.beginPath(); c.moveTo(ox, 0); c.bezierCurveTo(ox + 40, 70, ox - 40, 140, ox + 20, 230 + r() * 120); c.stroke();
      for (let i = 0; i < 6; i++) { const ty = 30 + i * 36; c.beginPath(); c.moveTo(ox + 8, ty); c.lineTo(ox + 24, ty + 6); c.lineTo(ox + 8, ty + 12); c.fill(); }
    });
  }
  for (let x = 120; x < w; x += 520 + r() * 300) { wrapX(w, x, 60, (ox) => { c.fillRect(ox, h - 120, 26, 120); c.fillRect(ox - 14, h - 100, 54, 12); }); } // grave crosses
}

const art: BackdropArt = {
  sky: [[0, '#06020e'], [0.5, '#1b0e34'], [0.85, '#442858'], [1, '#6c4470']],
  far: { w: 2048, h: 560, draw: farCastle },
  mid: { w: 2048, h: 420, draw: midTrees },
  near: { w: 2048, h: 600, draw: nearThorns },
};

function backdropFx(g: G, f: BackdropFrame): void {
  const { w, h, zoom, t } = f;
  g.clear();
  const bolt = hash(Math.floor(t * 0.4));
  const flash = bolt > 0.93 ? Math.max(0, 1 - ((t * 0.4) % 1) * 5) : 0;
  if (flash > 0) g.fillStyle(0xc9b8ff, 0.18 * flash).fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { // bats
    const bx = ((hash(i + 40) * w + t * (40 + i * 11) * zoom * (i % 2 ? 1 : -1)) % (w + 200 * zoom) + w + 200 * zoom) % (w + 200 * zoom) - 100 * zoom;
    const by = h * (0.12 + 0.3 * hash(i)) + Math.sin(t * 3 + i) * 14 * zoom, fl = Math.sin(t * 14 + i) * 5 * zoom;
    g.lineStyle(2 * zoom, 0x0b0618, 0.95).beginPath().moveTo(bx - 9 * zoom, by - fl).lineTo(bx, by + 2 * zoom).lineTo(bx + 9 * zoom, by - fl).strokePath();
  }
  for (let i = 0; i < 3; i++) { // fog banks crawling the forest floor
    const fx = ((hash(i + 8) * w + t * (7 + i * 3) * zoom) % (w + 800 * zoom)) - 400 * zoom;
    g.fillStyle(0xb9a4d8, 0.08).fillEllipse(fx, f.sy(0.1, 0.88, 70 + i * 28), 780 * zoom, 56 * zoom);
  }
}

/* ------------------------------------------------------------------ helpers */

function stoneWall(g: G, x: number, y: number, w: number, h: number, base: number): void {
  g.fillStyle(base, 1).fillRect(x, y, w, h);
  g.lineStyle(2, HOL.ink, 0.5);
  for (let row = 0, yy = y + 30; yy < y + h; row++, yy += 30) { g.lineBetween(x, yy, x + w, yy); for (let xx = x + 70 + (row % 2) * 35; xx < x + w; xx += 100) g.lineBetween(xx, yy - 30, xx, yy); }
  g.fillStyle(0xffffff, 0.05).fillRect(x, y, w, 6);
}

function battlements(g: G, x: number, y: number, w: number, col: number): void {
  g.fillStyle(col, 1);
  for (let xx = x; xx < x + w - 12; xx += 40) g.fillRect(xx, y - 18, 24, 18);
}

/* ------------------------------------------------------------------ theme */

export const hollowTheme: WorldTheme = {
  id: 'hollow',
  accent: HOL.ghost,
  backdrop: art,
  backdropFx,

  drawSolid(g, s) {
    switch (s.kind) {
      case 'ground': {
        g.fillStyle(HOL.soilLight, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(HOL.soil, 1).fillRect(s.x, s.y + 20, s.w, s.h - 20);
        g.fillStyle(0x3a5a3a, 1).fillRect(s.x, s.y, s.w, 6);
        g.lineStyle(2, 0x4d7a48, 1);
        for (let xx = s.x + 8; xx < s.x + s.w; xx += 20) g.lineBetween(xx, s.y + 3, xx + (hash(xx) - 0.5) * 8, s.y - 6 - hash(xx + 1) * 8);
        g.fillStyle(HOL.bone, 0.5);
        for (let xx = s.x + 60; xx < s.x + s.w; xx += 240) g.fillRect(xx, s.y + 30 + hash(xx) * 40, 18, 3).fillCircle(xx, s.y + 32 + hash(xx) * 40, 3);
        break;
      }
      case 'roof': { // castle wall walk
        stoneWall(g, s.x, s.y, s.w, s.h, HOL.stone);
        battlements(g, s.x, s.y, s.w, HOL.stone);
        g.fillStyle(0x2f6a4a, 0.55).fillRect(s.x, s.y, s.w, 5);
        break;
      }
      case 'crate': { // mausoleum block
        stoneWall(g, s.x, s.y, s.w, s.h, 0x3c384a);
        g.lineStyle(3, HOL.stoneDark, 1).strokeRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0x2f6a4a, 0.7).fillRect(s.x, s.y, s.w, 6);
        g.lineStyle(3, HOL.bone, 0.45).lineBetween(s.x + s.w / 2, s.y + 12, s.x + s.w / 2, s.y + 36).lineBetween(s.x + s.w / 2 - 9, s.y + 20, s.x + s.w / 2 + 9, s.y + 20);
        break;
      }
      case 'gate': { stoneWall(g, s.x, s.y, s.w, s.h, HOL.stoneDark); g.fillStyle(HOL.blood, 0.9).fillRect(s.x, s.y + s.h * 0.4, s.w, 10); break; }
      default: stoneWall(g, s.x, s.y, s.w, s.h, HOL.stoneDark);
    }
  },

  drawLedge(g, o) { // gnarled branch with leaf-less twigs
    g.fillStyle(HOL.wood, 1).fillRect(o.x, o.y, o.w, 10);
    g.fillStyle(0x4a3040, 1).fillRect(o.x, o.y, o.w, 3);
    g.lineStyle(3, HOL.wood, 1);
    for (let xx = o.x + 20; xx < o.x + o.w - 10; xx += 46) g.lineBetween(xx, o.y + 8, xx + (hash(xx) - 0.5) * 30, o.y + 22 + hash(xx + 1) * 12);
    g.fillStyle(HOL.ghost, 0.35).fillCircle(o.x + o.w - 10, o.y + 2, 4);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'deadtree': {
        g.fillStyle(0x140d1c, 1).fillRect(d.x + d.w / 2 - 16, d.y + 40, 32, d.h - 40);
        g.fillTriangle(d.x + d.w / 2 - 16, d.y + d.h, d.x + d.w / 2 - 56, d.y + d.h, d.x + d.w / 2 - 12, d.y + d.h - 70).fillTriangle(d.x + d.w / 2 + 16, d.y + d.h, d.x + d.w / 2 + 56, d.y + d.h, d.x + d.w / 2 + 12, d.y + d.h - 70);
        g.lineStyle(7, 0x140d1c, 1);
        for (let i = 0; i < 6; i++) { const by = d.y + 60 + i * (d.h * 0.12), dir = i % 2 ? 1 : -1; g.beginPath().moveTo(d.x + d.w / 2, by).lineTo(d.x + d.w / 2 + dir * (30 + hash(d.seed + i) * 50), by - 30 - hash(d.seed + i + 4) * 30).lineTo(d.x + d.w / 2 + dir * (60 + hash(d.seed + i + 8) * 60), by - 20 - hash(d.seed + i + 2) * 50).strokePath(); }
        break;
      }
      case 'gravestone': {
        const k = Math.floor(hash(d.seed) * 3);
        g.fillStyle(0x4a4658, 1);
        if (k === 0) g.fillRect(d.x + d.w / 2 - 7, d.y, 14, d.h).fillRect(d.x + d.w / 2 - 22, d.y + d.h * 0.25, 44, 12);
        else if (k === 1) g.fillRect(d.x, d.y + 14, d.w, d.h - 14).fillEllipse(d.x + d.w / 2, d.y + 16, d.w, 30);
        else g.fillRect(d.x + 6, d.y + 6, d.w - 12, d.h - 6).fillTriangle(d.x + 2, d.y + 8, d.x + d.w - 2, d.y + 8, d.x + d.w / 2, d.y - 10);
        g.fillStyle(0x2f6a4a, 0.7).fillRect(d.x, d.y + d.h - 8, d.w, 8);
        break;
      }
      case 'crypt': {
        stoneWall(g, d.x, d.y + 30, d.w, d.h - 30, 0x3c384a);
        g.fillStyle(0x2c283a, 1).fillTriangle(d.x - 10, d.y + 32, d.x + d.w + 10, d.y + 32, d.x + d.w / 2, d.y - 10);
        g.fillStyle(0x07030f, 1).fillRect(d.x + d.w / 2 - 20, d.y + d.h - 80, 40, 80).fillEllipse(d.x + d.w / 2, d.y + d.h - 80, 40, 30);
        g.fillStyle(HOL.ghost, 0.1).fillRect(d.x + d.w / 2 - 20, d.y + d.h - 80, 40, 80);
        break;
      }
      case 'castle': {
        stoneWall(g, d.x, d.y, d.w, d.h, 0x282434);
        battlements(g, d.x, d.y, d.w, 0x282434);
        for (let xx = d.x + 40; xx < d.x + d.w - 60; xx += 130) { g.fillStyle(0x07030f, 1).fillRect(xx, d.y + 60, 30, 70).fillEllipse(xx + 15, d.y + 60, 30, 34); g.fillStyle(0xb06cff, 0.5).fillRect(xx + 5, d.y + 74, 20, 48); }
        g.fillStyle(0x1d1a28, 1).fillRect(d.x - 20, d.y - 90, 80, d.h + 90).fillTriangle(d.x - 28, d.y - 90, d.x + 68, d.y - 90, d.x + 20, d.y - 170);
        break;
      }
      case 'fence': {
        g.fillStyle(0x0d0a14, 1).fillRect(d.x, d.y + d.h * 0.3, d.w, 5).fillRect(d.x, d.y + d.h * 0.75, d.w, 5);
        for (let xx = d.x + 4; xx < d.x + d.w; xx += 16) g.fillRect(xx, d.y + 6, 4, d.h - 6).fillTriangle(xx - 3, d.y + 8, xx + 7, d.y + 8, xx + 2, d.y - 8);
        break;
      }
      case 'lantern': g.lineStyle(2, 0x0d0a14, 1).lineBetween(d.x, d.y - d.h, d.x, d.y - d.h + 30).strokeRect(d.x - 8, d.y - d.h + 30, 16, 22); g.fillStyle(0x0d0a14, 1).fillRect(d.x - 3, d.y - d.h - 40, 6, 40 + 30); break;
      case 'candelabra': g.fillStyle(0x6a5a3a, 1).fillRect(d.x - 3, d.y - d.h, 6, d.h).fillRect(d.x - 14, d.y - 6, 28, 6).fillRect(d.x - 18, d.y - d.h + 10, 36, 4); break;
      case 'coffin': g.fillStyle(0x3a2230, 1).fillTriangle(d.x, d.y + d.h * 0.3, d.x + d.w, d.y + d.h * 0.3, d.x + d.w / 2, d.y).fillRect(d.x, d.y + d.h * 0.3, d.w, d.h * 0.7).fillStyle(0x6a5a3a, 1).fillRect(d.x + d.w / 2 - 2, d.y + d.h * 0.35, 4, d.h * 0.5).fillRect(d.x + d.w / 2 - 8, d.y + d.h * 0.45, 16, 4); break;
      case 'thorns': {
        g.lineStyle(5, 0x07030f, 0.95);
        for (let i = 0; i < 3; i++) { const vx = d.x + i * 24; g.beginPath().moveTo(vx, d.y).lineTo(vx + (hash(d.seed + i) - 0.5) * 40, d.y + d.h * 0.5).lineTo(vx + (hash(d.seed + i + 4) - 0.5) * 30, d.y + d.h).strokePath(); for (let k = 1; k < 5; k++) g.fillStyle(0x07030f, 0.95).fillTriangle(vx + 2, d.y + k * d.h / 5, vx + 12, d.y + k * d.h / 5 + 4, vx + 2, d.y + k * d.h / 5 + 10); }
        break;
      }
      case 'sign': {
        g.fillStyle(HOL.wood, 1).fillRect(d.x + 10, d.y + d.h, 7, 60).fillRect(d.x + d.w - 17, d.y + d.h, 7, 60);
        g.fillStyle(0x1b1220, 1).fillRect(d.x, d.y, d.w, d.h).lineStyle(2, HOL.bone, 0.6).strokeRect(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
        ctx.text(d, 0xcfc6e8);
        break;
      }
      case 'door': { // gothic arch
        g.fillStyle(0x07030f, 1).fillRect(d.x, d.y + 20, d.w, d.h - 20).fillEllipse(d.x + d.w / 2, d.y + 20, d.w, 60);
        g.lineStyle(5, 0x4a4658, 1).strokeRect(d.x, d.y + 20, d.w, d.h - 20).strokeEllipse(d.x + d.w / 2, d.y + 20, d.w, 60);
        g.fillStyle(HOL.ghost, 0.12).fillRect(d.x, d.y + 20, d.w, d.h - 20);
        if (d.text) ctx.text({ ...d, y: d.y - 34, h: 24 }, 0xcfc6e8);
        break;
      }
      default: break;
    }
  },

  animated: {
    lantern: {
      layer: 'back', pad: 90,
      draw(g, d, t) { // ghost-flame lantern swaying
        const sw = Math.sin(t * 1.4 + d.seed) * 3, k = 0.75 + 0.25 * Math.sin(t * 9 + d.seed);
        g.fillStyle(HOL.ghost, 0.14 * k).fillCircle(d.x + sw, d.y - d.h + 42, 70);
        g.fillStyle(HOL.ghost, 0.95).fillTriangle(d.x - 5 + sw, d.y - d.h + 48, d.x + 5 + sw, d.y - d.h + 48, d.x + sw, d.y - d.h + 30 + 6 * (1 - k));
      },
    },
    candelabra: {
      layer: 'back', pad: 90,
      draw(g, d, t) { for (let i = -1; i <= 1; i++) { const k = 0.7 + 0.3 * Math.sin(t * 11 + i * 2 + d.seed); g.fillStyle(0xffd27a, 0.12 * k).fillCircle(d.x + i * 14, d.y - d.h + 4, 40); g.fillStyle(0xffe6a8, 0.95).fillTriangle(d.x + i * 14 - 3, d.y - d.h + 10, d.x + i * 14 + 3, d.y - d.h + 10, d.x + i * 14, d.y - d.h - 6 * k); } },
    },
    crypt: {
      layer: 'back', pad: 40,
      draw(g, d, t) { const k = 0.4 + 0.4 * Math.sin(t * 1.2 + d.seed); g.fillStyle(HOL.ghost, 0.1 * k).fillEllipse(d.x + d.w / 2, d.y + d.h - 6, d.w * 1.6, 26); },
    },
    gravestone: {
      layer: 'back', pad: 30,
      draw(g, d, t) { for (let i = 0; i < 2; i++) { const u = (t * 0.2 + hash(d.seed + i)) % 1; g.fillStyle(HOL.ghost, 0.45 * (1 - u)).fillCircle(d.x + d.w / 2 + Math.sin(t + i * 3) * 16, d.y + d.h - u * 150, 4 + u * 4); } },
    },
    castle: {
      layer: 'back', pad: 80,
      draw(g, d, t) { if (Math.sin(t * 0.9 + d.seed) > 0.6) g.fillStyle(0xb06cff, 0.25).fillCircle(d.x + 55, d.y + 98, 34); },
    },
  },

  ambient(scene): AmbientParticles {
    const g = scene.add.graphics().setDepth(67);
    return {
      update(_dt, view, t) { // drifting wisps and fog
        g.clear();
        for (let i = 0; i < 5; i++) { const mx = view.left + (((hash(i) * view.width * 1.4 + t * (10 + i * 3)) % (view.width * 1.4)) - view.width * 0.2); g.fillStyle(0xb9a4d8, 0.05).fillEllipse(mx, GROUND_Y - 20 - i * 36, 520, 60); }
        for (let i = 0; i < 12; i++) {
          const px = view.left + hash(i + 70) * view.width + Math.sin(t * 0.5 + i) * 26, py = view.top + view.height * (0.4 + 0.5 * hash(i + 3)) + Math.cos(t * 0.7 + i * 2) * 20;
          const on = 0.3 + 0.7 * Math.max(0, Math.sin(t * 1.6 + i));
          g.fillStyle(HOL.ghost, 0.14 * on).fillCircle(px, py, 10).fillStyle(0xd0ffe4, on * 0.9).fillCircle(px, py, 2);
        }
      },
    };
  },
};
