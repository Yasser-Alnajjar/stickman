import type Phaser from 'phaser';
import type { RegionDef } from '@/game/config/regions';
import type { BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, hash, mulberry32, vgrad } from '../../kit';
import { t } from '@/i18n';
import { COG, cogTheme, gearPath } from './theme';

type Ctx = CanvasRenderingContext2D;

/** The Great Escapement: the heart of the clockwork city, a hall of meshing gears and a vast pendulum. */
const strike = { at: -99 };

function farMesh(c: Ctx, w: number, h: number): void {
  const r = mulberry32(12);
  vgrad(c, 0, 0, w, h, [[0, '#0a0503'], [1, '#2a170a']]);
  for (let i = 0; i < 6; i++) {
    const rad = 120 + r() * 140, cx = (i + 0.5) * (w / 6) + (r() - 0.5) * 60, cy = h - 220 - r() * 200, teeth = 18 + Math.floor(rad / 12);
    c.fillStyle = `rgba(${90 + r() * 40},${58 + r() * 20},${24 + r() * 10},0.95)`; c.beginPath(); c.arc(cx, cy, rad, 0, 7); c.fill();
    for (let k = 0; k < teeth; k++) { const a = (k * Math.PI * 2) / teeth, tw = (Math.PI * 2 * rad) / teeth * 0.4; c.beginPath(); c.moveTo(cx + Math.cos(a) * rad - Math.sin(a) * tw, cy + Math.sin(a) * rad + Math.cos(a) * tw); c.lineTo(cx + Math.cos(a) * rad * 1.26, cy + Math.sin(a) * rad * 1.26); c.lineTo(cx + Math.cos(a) * rad + Math.sin(a) * tw, cy + Math.sin(a) * rad - Math.cos(a) * tw); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(cx, cy, rad * 0.3, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,179,71,0.4)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, rad * 0.65, 0, 7); c.stroke();
  }
}

function midPendulum(c: Ctx, w: number, h: number): void {
  for (let x = 90; x < w; x += 360) {
    c.fillStyle = '#0d0704'; c.fillRect(x, 0, 14, h - 120); c.beginPath(); c.arc(x + 7, h - 120, 52, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,179,71,0.5)'; c.beginPath(); c.arc(x + 7, h - 120, 34, 0, 7); c.fill();
    c.fillStyle = '#0d0704'; c.fillRect(x - 180, 40, 380, 10);
  }
  vgrad(c, 0, h - 90, w, 90, [[0, 'rgba(120,60,10,0)'], [1, 'rgba(120,60,10,0.5)']]);
}

function nearChains(c: Ctx, w: number, h: number): void {
  const r = mulberry32(5);
  c.strokeStyle = '#030201'; c.lineWidth = 7;
  for (let x = 40; x < w; x += 240 + r() * 240) { const ln = 100 + r() * 360; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, ln); c.stroke(); c.fillStyle = '#030201'; c.fillRect(x - 12, ln, 24, 30); }
}

const art: BackdropArt = {
  sky: [[0, '#070302'], [0.6, '#190d06'], [1, '#2c180a']],
  far: { w: 2048, h: 560, draw: farMesh },
  mid: { w: 2048, h: 420, draw: midPendulum },
  near: { w: 2048, h: 520, draw: nearChains },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const k = Math.max(0, 1 - (f.t - strike.at) / 1.4);
  for (let i = 0; i < 3; i++) gearPath(g, f.w * (0.2 + i * 0.3), f.h * (0.32 + 0.12 * hash(i)), (130 + 40 * hash(i + 4)) * f.zoom, 20, f.t * (i % 2 ? 0.35 : -0.28) * (1 + k), COG.brassDark, 0.3 + 0.2 * k, 0.3);
  for (let i = 0; i < 6; i++) { const u = (f.t * 0.12 + hash(i)) % 1; g.fillStyle(COG.amber, 0.5 * (1 - u)).fillRect(f.w * hash(i + 4), f.h - u * f.h * 0.9, 2 * f.zoom, 2 * f.zoom); }
  if (k > 0) g.fillStyle(COG.amber, 0.12 * k).fillRect(0, 0, f.w, f.h);
}

export const horolTheme: WorldTheme = {
  ...cogTheme,
  id: 'arena_horol',
  accent: COG.amber,
  backdrop: art,
  backdropFx,
  stage: {
    flash: [255, 179, 71],
    onStart({ scene, fx, region }) { // the great bell tolls, every gear snaps into mesh
      strike.at = scene.time.now / 1000;
      scene.cameras.main.flash(420, 255, 179, 71);
      fx.shake(0.016, 1000);
      for (let i = 0; i < 6; i++) scene.time.delayedCall(i * 150, () => fx.ring(300 + i * 360, 320, COG.amber, 20, 160, 500, 6));
      fx.text(region.boss ? region.boss.x - 220 : 1500, 520, t('THE HOUR STRIKES'), '#ffc870', 28, 1400);
    },
    drawBarrier(g, x, h) { // a portcullis of interlocking gear teeth
      g.fillStyle(0x1c1410, 0.97).fillRect(x - 16, 0, 32, h);
      g.fillStyle(COG.amber, 0.3).fillRect(x - 34, 0, 68, h);
      for (let y = 20; y < h; y += 64) gearPath(g, x, y, 20, 8, y * 0.05, COG.brass, 1, 0.3);
    },
  },
  drawLedge(g, o) { // brass cog-rimmed platform
    g.fillStyle(0x2a1d14, 1).fillRect(o.x, o.y, o.w, 10);
    g.fillStyle(COG.brass, 1).fillRect(o.x, o.y, o.w, 4);
    g.fillStyle(COG.amber, 0.6).fillRect(o.x + 6, o.y + 5, o.w - 12, 2);
    gearPath(g, o.x + 12, o.y + 16, 9, 8, 0, COG.brassDark, 1, 0.3); gearPath(g, o.x + o.w - 12, o.y + 16, 9, 8, 0.4, COG.brassDark, 1, 0.3);
  },
  drawDecor(g, d, ctx) {
    if (d.kind === 'pendulum') { g.lineStyle(6, 0x0d0704, 1).lineBetween(d.x, d.y, d.x, d.y + d.h); return; }
    if (d.kind === 'dais') { g.fillStyle(0x2a1d14, 1).fillRect(d.x, d.y, d.w, d.h).fillStyle(COG.brass, 1).fillRect(d.x, d.y, d.w, 8); for (let xx = d.x + 14; xx < d.x + d.w - 20; xx += 40) g.fillStyle(COG.amber, 0.5).fillRect(xx, d.y + 16, 20, 4); return; }
    if (d.kind === 'cogfloor') return;
    cogTheme.drawDecor(g, d, ctx);
  },
  animated: {
    ...cogTheme.animated,
    pendulum: {
      layer: 'back', pad: 220,
      draw(g, d, t) { const sw = Math.sin(t * 1.1 + d.seed) * 0.5, bx = d.x + Math.sin(sw) * d.h, by = d.y + Math.cos(sw) * d.h; g.lineStyle(6, 0x0d0704, 1).lineBetween(d.x, d.y, bx, by); g.fillStyle(COG.brass, 1).fillCircle(bx, by, 40).fillStyle(COG.amber, 0.5).fillCircle(bx, by, 26); },
    },
    cogfloor: {
      layer: 'back', pad: 20,
      draw(g, d, t) { const k = Math.max(0, 1 - (t - strike.at) / 1.4); for (let i = 0; i < d.w / 90; i++) gearPath(g, d.x + i * 90 + 45, GROUND_Y + 34, 14, 8, t * (i % 2 ? 1 : -1) * (1 + 2 * k), COG.brassDark, 0.8, 0.3); },
    },
  },
  ambient(scene, region) {
    strike.at = -99;
    return cogTheme.ambient!(scene, region);
  },
};

export function buildHorolArena(): RegionDef {
  return arenaRegion({
    id: 'horol_arena', name: 'The Great Escapement', theme: 'arena_horol', width: 2400, boss: 'horol', bossX: 1850, lampId: 'escapement_lamp', lampName: 'Escapement Lamp',
    scale: { hp: 3.6, atk: 2.5 },
    // a rolling wave of brass catwalks cresting at a high platform, like a pendulum's arc
    platforms: [[740, 840, 180], [960, 740, 160], [1180, 840, 160], [1400, 740, 160], [1620, 640, 200], [1900, 740, 160], [2120, 840, 180]],
    decorate(b) {
      b.add('dais', 1960, GROUND_Y - 120, 300, 120);
      for (const x of [640, 1300, 1950]) b.add('pendulum', x, 0, 0, 520);
      for (const x of [300, 1600]) b.add('boiler', x, GROUND_Y - 220, 120, 220);
      for (const x of [520, 1240, 2260]) b.add('lamp', x, GROUND_Y, 20, 200);
      b.add('furnace', 1100, GROUND_Y - 190, 170, 190);
      b.add('cogfloor', 600, GROUND_Y, 1700, 0);
      b.add('steamvent', 900, GROUND_Y, 30, 0, undefined, 'front'); b.add('steamvent', 1700, GROUND_Y, 30, 0, undefined, 'front');
    },
  });
}
