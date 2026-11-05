import type Phaser from 'phaser';
import type { RegionDef } from '@/game/config/regions';
import type { BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, hash, mulberry32, vgrad, wrapX } from '../../kit';
import { t } from '@/i18n';
import { AET, aetherTheme } from './theme';

type Ctx = CanvasRenderingContext2D;

/** The Tempest Throne: the highest terrace of the citadel, in the eye of a permanent storm. */
const storm = { at: -99 };

function farStorm(c: Ctx, w: number, h: number): void {
  const r = mulberry32(31);
  vgrad(c, 0, 0, w, h, [[0, '#0b0f2c'], [0.6, '#2a2160'], [1, '#5a3a8a']]);
  for (let i = 0; i < 16; i++) {
    const cx = r() * w, cy = 80 + r() * (h - 200), rw = 160 + r() * 260;
    wrapX(w, cx - rw, rw * 2, (ox) => { c.fillStyle = `rgba(${40 + r() * 40},${30 + r() * 30},${90 + r() * 50},0.8)`; c.beginPath(); c.ellipse(ox + rw, cy, rw, 40 + r() * 60, 0, 0, 7); c.fill(); });
  }
  // a colossal vortex of cloud around a clear eye
  c.strokeStyle = 'rgba(190,170,255,0.35)'; c.lineWidth = 6;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(w * 0.5, h - 280, 340 - k * 60, 120 - k * 20, 0.1 * k, 0, 7); c.stroke(); }
  const eye = c.createRadialGradient(w * 0.5, h - 280, 10, w * 0.5, h - 280, 160); eye.addColorStop(0, 'rgba(255,240,200,0.9)'); eye.addColorStop(1, 'rgba(255,240,200,0)');
  c.fillStyle = eye; c.fillRect(w * 0.5 - 160, h - 440, 320, 320);
}

function midRuins(c: Ctx, w: number, h: number): void {
  const r = mulberry32(7);
  for (let x = 30; x < w; x += 260 + r() * 160) {
    const th = 140 + r() * 220;
    wrapX(w, x, 120, (ox) => {
      c.fillStyle = 'rgba(28,22,60,0.95)'; c.fillRect(ox, h - th, 54, th); c.fillRect(ox - 8, h - th - 12, 70, 14);
      c.fillStyle = 'rgba(255,246,160,0.35)'; for (let j = 0; j < Math.floor(th / 50); j++) c.fillRect(ox + 20, h - th + 16 + j * 46, 14, 20);
      if (r() > 0.5) { c.fillStyle = 'rgba(28,22,60,0.95)'; c.beginPath(); c.moveTo(ox + 54, h - th * 0.5); c.lineTo(ox + 120, h - th * 0.4); c.lineTo(ox + 54, h - th * 0.3); c.fill(); }
    });
  }
  vgrad(c, 0, h - 80, w, 80, [[0, 'rgba(90,60,150,0)'], [1, 'rgba(90,60,150,0.5)']]);
}

function nearRain(c: Ctx, w: number, h: number): void {
  const r = mulberry32(9);
  c.fillStyle = 'rgba(12,10,36,0.9)';
  for (let x = 50; x < w; x += 340 + r() * 280) wrapX(w, x, 80, (ox) => { c.fillRect(ox, h - 200 - r() * 200, 20, 400); c.fillRect(ox - 14, h - 214 - r() * 10, 48, 14); });
}

const art: BackdropArt = {
  sky: [[0, '#070a22'], [0.6, '#1f1850'], [1, '#43286e']],
  far: { w: 2048, h: 560, draw: farStorm },
  mid: { w: 2048, h: 420, draw: midRuins },
  near: { w: 2048, h: 520, draw: nearRain },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const k = Math.max(0, 1 - (f.t - storm.at) / 1.4);
  const n = Math.floor(f.t * 0.7), phase = (f.t * 0.7) % 1;
  if (hash(n) > 0.45 || k > 0) { // forks of lightning in the distance
    const a = Math.max(0, 1 - phase * 3) + k;
    const x0 = f.w * (0.15 + 0.7 * hash(n + 2));
    g.lineStyle(3 * f.zoom, 0xfff6a0, Math.min(1, a)).beginPath().moveTo(x0, 0);
    let x = x0, y = 0; for (let i = 0; i < 7; i++) { x += (hash(n * 7 + i) - 0.5) * 60 * f.zoom; y += f.h * 0.1; g.lineTo(x, y); }
    g.strokePath();
    if (a > 0) g.fillStyle(0xd8d0ff, 0.12 * Math.min(1, a)).fillRect(0, 0, f.w, f.h);
  }
  g.lineStyle(1.5 * f.zoom, 0xb9b0ff, 0.35);
  for (let i = 0; i < 40; i++) { const x = ((hash(i) * f.w + f.t * 260 * f.zoom) % f.w), y = ((hash(i + 40) * f.h + f.t * 520 * f.zoom) % f.h); g.lineBetween(x, y, x - 8 * f.zoom, y + 22 * f.zoom); }
}

export const zephyrosTheme: WorldTheme = {
  ...aetherTheme,
  id: 'arena_zephyros',
  accent: AET.bolt,
  backdrop: art,
  backdropFx,
  stage: {
    flash: [255, 246, 160],
    onStart({ scene, fx, region }) { // the sky splits: a column of light and a roll of thunder
      storm.at = scene.time.now / 1000;
      scene.cameras.main.flash(520, 255, 246, 160);
      fx.shake(0.02, 1100);
      for (let i = 0; i < 6; i++) scene.time.delayedCall(i * 130, () => fx.bolt(280 + i * 360, 0, 330 + i * 360, GROUND_Y, 0xfff6a0, 280));
      fx.text(region.boss ? region.boss.x - 220 : 1500, 520, t('THE STORM BREAKS'), '#fff6a0', 30, 1500);
    },
    drawBarrier(g, x, h) { // a wall of crackling wind
      g.fillStyle(0x2a2160, 0.95).fillRect(x - 16, 0, 32, h);
      g.fillStyle(AET.bolt, 0.35).fillRect(x - 34, 0, 68, h);
      g.lineStyle(3, AET.bolt, 0.95);
      for (let y = 0; y < h; y += 60) g.beginPath().moveTo(x - 14, y).lineTo(x + 8, y + 18).lineTo(x - 8, y + 30).lineTo(x + 14, y + 52).strokePath();
    },
  },
  drawLedge(g, o) { // shattered marble slab drifting in the storm, with a crackle of static
    g.fillStyle(AET.marbleDark, 1).fillRect(o.x, o.y, o.w, 12);
    g.fillStyle(AET.marble, 1).fillRect(o.x, o.y, o.w, 3);
    g.fillStyle(0x6a5aa8, 1).fillTriangle(o.x + 8, o.y + 12, o.x + o.w - 8, o.y + 12, o.x + o.w / 2, o.y + 38);
    g.fillStyle(AET.bolt, 0.9).fillRect(o.x + 4, o.y - 2, 4, 6).fillRect(o.x + o.w - 8, o.y - 2, 4, 6);
  },
  drawDecor(g, d, ctx) {
    if (d.kind === 'throne') {
      marble(g, d.x, d.y + d.h * 0.45, d.w, d.h * 0.55);
      g.fillStyle(AET.marble, 1).fillRect(d.x + d.w * 0.25, d.y, d.w * 0.5, d.h * 0.55);
      g.fillStyle(AET.gold, 1).fillTriangle(d.x + d.w * 0.5 - 40, d.y, d.x + d.w * 0.5 + 40, d.y, d.x + d.w * 0.5, d.y - 80).fillCircle(d.x + d.w * 0.5, d.y + d.h * 0.25, 12);
      g.fillStyle(0xffffff, 1).fillTriangle(d.x + d.w * 0.25, d.y + 20, d.x - 60, d.y - 40, d.x + d.w * 0.12, d.y + d.h * 0.5).fillTriangle(d.x + d.w * 0.75, d.y + 20, d.x + d.w + 60, d.y - 40, d.x + d.w * 0.88, d.y + d.h * 0.5);
      return;
    }
    if (d.kind === 'ruin') { g.fillStyle(AET.marbleDark, 1).fillRect(d.x, d.y, d.w, d.h).fillTriangle(d.x, d.y, d.x + d.w * 0.4, d.y, d.x, d.y - 40).fillTriangle(d.x + d.w, d.y, d.x + d.w * 0.6, d.y, d.x + d.w, d.y - 30); return; }
    if (d.kind === 'stormfloor') return;
    aetherTheme.drawDecor(g, d, ctx);
  },
  animated: {
    ...aetherTheme.animated,
    stormfloor: {
      layer: 'back', pad: 20,
      draw(g, d, t) { const k = Math.max(0, 1 - (t - storm.at) / 1.4); for (let i = 0; i < d.w / 140; i++) g.fillStyle(AET.bolt, 0.14 + 0.1 * Math.sin(t * 3 + i) + 0.4 * k).fillRect(d.x + i * 140 + 30, GROUND_Y + 16, 80, 3); },
    },
    throne: {
      layer: 'back', pad: 100,
      draw(g, d, t) { const k = Math.max(0, 1 - (t - storm.at) / 1.4); g.fillStyle(AET.bolt, 0.08 + 0.06 * Math.sin(t * 2) + 0.2 * k).fillCircle(d.x + d.w / 2, d.y + d.h * 0.25, 150); },
    },
  },
  ambient(scene, region) {
    storm.at = -99;
    return aetherTheme.ambient!(scene, region);
  },
};

function marble(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  g.fillStyle(AET.marbleDark, 1).fillRect(x, y, w, h).fillStyle(AET.gold, 1).fillRect(x, y, w, 6);
  g.lineStyle(2, AET.ink, 0.25); for (let xx = x + 70; xx < x + w; xx += 70) g.lineBetween(xx, y, xx, y + h);
}

export function buildZephyrosArena(): RegionDef {
  return arenaRegion({
    id: 'zephyros_arena', name: 'Tempest Throne', theme: 'arena_zephyros', width: 2700, boss: 'zephyros', bossX: 2050, lampId: 'tempest_lamp', lampName: 'Tempest Throne Lamp',
    scale: { hp: 4.0, atk: 2.75 },
    // drifting slabs in a rising arc, topped by a crown platform above the eye of the storm
    platforms: [[720, 850, 200], [1000, 760, 170], [1270, 670, 170], [1540, 580, 230], [1850, 670, 170], [2120, 760, 170], [2400, 850, 200]],
    decorate(b) {
      b.add('throne', 2200, GROUND_Y - 300, 340, 300);
      for (const x of [300, 1200, 1700]) b.add('column', x, GROUND_Y - 500, 70, 500);
      for (const x of [500, 1450, 2000]) b.add('ruin', x, GROUND_Y - 90, 120, 90);
      for (const x of [620, 1330, 1900, 2560]) b.add('lantern', x, GROUND_Y, 20, 170);
      b.add('statue', 900, GROUND_Y - 290, 140, 290);
      b.add('stormfloor', 600, GROUND_Y, 1900, 0);
    },
  });
}
