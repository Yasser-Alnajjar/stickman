import type Phaser from 'phaser';
import type { RegionDef } from '@/game/config/regions';
import type { BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, hash, mulberry32, vgrad, wrapX } from '../../kit';
import { t } from '@/i18n';
import { DUNE, duneTheme } from './theme';

type Ctx = CanvasRenderingContext2D;

/** The Buried Throne: a vast tomb hall under the dunes, sand pouring from cracks in the ceiling. */
const surge = { at: -99 };

function farHall(c: Ctx, w: number, h: number): void {
  const r = mulberry32(14);
  vgrad(c, 0, 0, w, h, [[0, '#120905'], [1, '#2b170a']]);
  // colossal seated statues along the back wall
  for (let x = 120; x < w; x += 520) {
    wrapX(w, x - 120, 360, (ox) => {
      c.fillStyle = '#3d2412'; c.fillRect(ox, h - 360, 260, 360);
      c.fillStyle = '#4a2c16'; c.fillRect(ox + 70, h - 470, 120, 120); c.fillRect(ox + 50, h - 520, 160, 70);
      c.fillStyle = '#f2c84a'; c.fillRect(ox + 100, h - 430, 20, 8); c.fillRect(ox + 140, h - 430, 20, 8); c.fillRect(ox + 40, h - 340, 180, 8);
      const g = c.createRadialGradient(ox + 130, h - 420, 0, ox + 130, h - 420, 170);
      g.addColorStop(0, 'rgba(242,200,74,0.22)'); g.addColorStop(1, 'rgba(242,200,74,0)'); c.fillStyle = g; c.fillRect(ox - 40, h - 590, 340, 340);
    });
  }
  c.fillStyle = 'rgba(242,200,74,0.22)';
  for (let y = 40; y < h - 540; y += 40) for (let x = 0; x < w; x += 44 + r() * 20) c.fillRect(x, y, 16, 10);
}

function midPillars(c: Ctx, w: number, h: number): void {
  for (let x = 60; x < w; x += 340) {
    c.fillStyle = '#2a170a';
    wrapX(w, x, 90, (ox) => { c.fillRect(ox, 0, 70, h); c.fillRect(ox - 12, 0, 94, 30); c.fillRect(ox - 12, h - 30, 94, 30); });
    c.fillStyle = 'rgba(242,200,74,0.35)';
    wrapX(w, x + 24, 24, (ox) => { for (let y = 60; y < h - 60; y += 56) c.fillRect(ox, y, 22, 26); });
  }
  vgrad(c, 0, h - 100, w, 100, [[0, 'rgba(80,45,20,0)'], [1, 'rgba(80,45,20,0.6)']]);
}

function nearDust(c: Ctx, w: number, h: number): void {
  const r = mulberry32(44);
  c.fillStyle = '#0a0503';
  for (let x = 30; x < w; x += 240 + r() * 280) { const ln = 120 + r() * 300; wrapX(w, x, 80, (ox) => { c.beginPath(); c.moveTo(ox - 18, 0); c.lineTo(ox + 18, 0); c.lineTo(ox + 4, ln); c.fill(); }); }
}

const art: BackdropArt = {
  sky: [[0, '#0a0402'], [0.6, '#1c0f06'], [1, '#33200e']],
  far: { w: 2048, h: 560, draw: farHall },
  mid: { w: 2048, h: 420, draw: midPillars },
  near: { w: 2048, h: 540, draw: nearDust },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const k = Math.max(0, 1 - (f.t - surge.at) / 1.4);
  for (let i = 0; i < 5; i++) { // sand pouring through ceiling cracks
    const x = f.w * (0.12 + i * 0.19);
    g.fillStyle(0xe8c47a, 0.14 + 0.1 * k).fillRect(x, 0, (6 + k * 8) * f.zoom, f.h);
    for (let j = 0; j < 8; j++) g.fillStyle(0xf2d79a, 0.5).fillRect(x + (hash(i + j) - 0.5) * 20 * f.zoom, ((f.t * 180 + j * 90 + i * 40) % f.h), 2 * f.zoom, 8 * f.zoom);
  }
  if (k > 0) g.fillStyle(0xf2c84a, 0.12 * k).fillRect(0, 0, f.w, f.h);
}

export const khamsinTheme: WorldTheme = {
  ...duneTheme,
  id: 'arena_khamsin',
  accent: DUNE.gold,
  backdrop: art,
  backdropFx,
  stage: {
    flash: [255, 210, 120],
    onStart({ scene, fx, region }) { // the ceiling cracks open and the hall fills with falling sand
      surge.at = scene.time.now / 1000;
      scene.cameras.main.flash(400, 255, 210, 120);
      fx.shake(0.016, 1000);
      for (let i = 0; i < 8; i++) scene.time.delayedCall(i * 110, () => fx.debrisBurst(240 + i * 250, 200, 14));
      fx.text(region.boss ? region.boss.x - 220 : 1500, 520, t('THE SANDS RISE'), '#ffd27a', 28, 1400);
    },
    drawBarrier(g, x, h) { // a curtain of golden sand
      g.fillStyle(0x6a4220, 0.95).fillRect(x - 16, 0, 32, h);
      g.fillStyle(0xf2c84a, 0.4).fillRect(x - 34, 0, 68, h);
      g.fillStyle(0xfff0c0, 0.7);
      for (let y = 0; y < h; y += 34) g.fillRect(x - 12 + hash(y) * 16, y, 4, 22);
    },
  },
  drawLedge(g, o) { // carved gold-trimmed block
    g.fillStyle(DUNE.stoneDark, 1).fillRect(o.x, o.y, o.w, 16);
    g.fillStyle(DUNE.gold, 1).fillRect(o.x, o.y, o.w, 3).fillRect(o.x, o.y + 13, o.w, 3);
    g.fillStyle(DUNE.turq, 1);
    for (let xx = o.x + 12; xx < o.x + o.w - 10; xx += 34) g.fillRect(xx, o.y + 6, 10, 4);
  },
  drawDecor(g, d, ctx) {
    if (d.kind === 'throne') {
      g.fillStyle(0x3a2412, 1).fillRect(d.x, d.y + d.h * 0.4, d.w, d.h * 0.6).fillRect(d.x + d.w * 0.15, d.y, d.w * 0.7, d.h * 0.5);
      g.fillStyle(DUNE.gold, 1).fillRect(d.x + d.w * 0.15, d.y, d.w * 0.7, 8).fillRect(d.x, d.y + d.h * 0.4, d.w, 8).fillTriangle(d.x + d.w * 0.5 - 24, d.y, d.x + d.w * 0.5 + 24, d.y, d.x + d.w * 0.5, d.y - 60);
      g.fillStyle(DUNE.turq, 1).fillCircle(d.x + d.w * 0.5, d.y + d.h * 0.25, 10);
      return;
    }
    if (d.kind === 'statue') {
      g.fillStyle(0x4a2c16, 1).fillRect(d.x, d.y + 120, d.w, d.h - 120).fillRect(d.x + d.w * 0.25, d.y, d.w * 0.5, 140);
      g.fillStyle(DUNE.gold, 1).fillRect(d.x + d.w * 0.3, d.y + 40, d.w * 0.4, 8).fillRect(d.x, d.y + 120, d.w, 6);
      g.fillStyle(DUNE.turq, 1).fillTriangle(d.x + d.w * 0.2, d.y + 10, d.x + d.w * 0.8, d.y + 10, d.x + d.w * 0.5, d.y - 40);
      return;
    }
    if (d.kind === 'sandfloor') return;
    duneTheme.drawDecor(g, d, ctx);
  },
  animated: {
    ...duneTheme.animated,
    sandfloor: {
      layer: 'back', pad: 20,
      draw(g, d, t) { // shifting dunes along the hall floor
        const k = Math.max(0, 1 - (t - surge.at) / 1.4);
        for (let i = 0; i < d.w / 90; i++) g.fillStyle(0xf2d79a, 0.12 + 0.1 * Math.sin(t * 1.5 + i) + 0.3 * k).fillEllipse(d.x + i * 90 + 40, GROUND_Y + 4, 90, 8);
      },
    },
  },
  ambient(scene, region) {
    surge.at = -99;
    return duneTheme.ambient!(scene, region);
  },
};

export function buildKhamsinArena(): RegionDef {
  return arenaRegion({
    id: 'khamsin_arena', name: 'Buried Throne', theme: 'arena_khamsin', width: 2400, boss: 'khamsin', bossX: 1850, lampId: 'throne_lamp', lampName: 'Buried Throne Lamp',
    scale: { hp: 2.6, atk: 1.95 },
    // a symmetrical pair of stepped dais with a high central bridge: three lanes to dodge sand along
    platforms: [[720, 850, 170], [900, 750, 150], [1060, 650, 160], [1320, 560, 240], [1640, 650, 160], [1820, 750, 150], [2000, 850, 170]],
    decorate(b) {
      b.add('throne', 1980, GROUND_Y - 190, 280, 190);
      for (const x of [300, 1160, 1560]) b.add('statue', x, GROUND_Y - 420, 140, 420);
      for (const x of [520, 1360, 2260]) b.add('brazier', x, GROUND_Y, 40, 90);
      for (const x of [800, 1900]) b.add('banner', x, 300, 60, 160);
      b.add('sandfloor', 600, GROUND_Y, 1700, 0);
      for (const x of [700, 1500]) b.add('jar', x, GROUND_Y, 50, 60);
    },
  });
}
