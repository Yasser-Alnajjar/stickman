import type Phaser from 'phaser';
import type { RegionDef } from '@/game/config/regions';
import type { BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, hash, mulberry32, vgrad, wrapX } from '../../kit';
import { t } from '@/i18n';
import { HEL, heliosTheme } from './theme';

type Ctx = CanvasRenderingContext2D;

/** The Reactor Dome: a geodesic chamber around a caged star-core, ringed by conduits and sensor arrays. */
const overload = { at: -99 };

function farCore(c: Ctx, w: number, h: number): void {
  const r = mulberry32(3);
  vgrad(c, 0, 0, w, h, [[0, '#04061a'], [1, '#0b1236']]);
  for (let x = 260; x < w; x += 1024) {
    wrapX(w, x - 300, 600, (ox) => {
      const cx = ox + 300, cy = h - 280;
      const g = c.createRadialGradient(cx, cy, 10, cx, cy, 300);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.2, 'rgba(86,224,255,0.7)'); g.addColorStop(0.6, 'rgba(255,79,216,0.18)'); g.addColorStop(1, 'rgba(255,79,216,0)');
      c.fillStyle = g; c.fillRect(ox, cy - 300, 600, 600);
      c.strokeStyle = 'rgba(167,182,207,0.7)'; c.lineWidth = 6;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(cx, cy, 190 - i * 36, 70 + i * 30, i * 0.6, 0, 7); c.stroke(); }
    });
  }
  // dome ribs
  c.strokeStyle = 'rgba(86,224,255,0.25)'; c.lineWidth = 3;
  for (let x = 0; x < w; x += 128) { c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 40, h * 0.5, x + 10 + r() * 20, h); c.stroke(); }
}

function midArrays(c: Ctx, w: number, h: number): void {
  for (let x = 40; x < w; x += 250) {
    wrapX(w, x, 120, (ox) => {
      c.fillStyle = '#0a1128'; c.fillRect(ox, h - 280, 70, 280); c.fillRect(ox - 14, h - 294, 98, 16);
      c.fillStyle = 'rgba(86,224,255,0.7)'; for (let y = h - 260; y < h - 20; y += 36) c.fillRect(ox + 10, y, 50, 6);
      c.fillStyle = 'rgba(255,79,216,0.6)'; c.fillRect(ox + 30, h - 310, 10, 14);
    });
  }
  vgrad(c, 0, h - 70, w, 70, [[0, 'rgba(60,40,140,0)'], [1, 'rgba(60,40,140,0.5)']]);
}

function nearConduit(c: Ctx, w: number, h: number): void {
  const r = mulberry32(22);
  c.strokeStyle = '#02030b'; c.lineWidth = 12;
  for (let x = 40; x < w; x += 300 + r() * 260) wrapX(w, x, 20, (ox) => { c.beginPath(); c.moveTo(ox, 0); c.lineTo(ox, 100 + r() * 240); c.lineTo(ox + 40, 140 + r() * 240); c.stroke(); });
}

const art: BackdropArt = {
  sky: [[0, '#02030c'], [0.6, '#070d2a'], [1, '#0e1a4a']],
  far: { w: 2048, h: 560, draw: farCore },
  mid: { w: 2048, h: 420, draw: midArrays },
  near: { w: 2048, h: 520, draw: nearConduit },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const k = Math.max(0, 1 - (f.t - overload.at) / 1.4);
  const pulse = 0.5 + 0.5 * Math.sin(f.t * 2.2);
  g.fillStyle(HEL.neon, 0.04 + 0.04 * pulse + 0.2 * k).fillRect(0, 0, f.w, f.h);
  for (let i = 0; i < 6; i++) { // energy arcs crawling the dome
    const x = ((hash(i + 2) * f.w + f.t * (30 + i * 9) * f.zoom) % f.w);
    g.lineStyle(2 * f.zoom, i % 2 ? HEL.mag : HEL.neon, 0.25 + 0.5 * k).lineBetween(x, f.h * 0.05, x + Math.sin(f.t * 3 + i) * 50 * f.zoom, f.h * (0.2 + 0.15 * hash(i)));
  }
}

export const aegisTheme: WorldTheme = {
  ...heliosTheme,
  id: 'arena_aegis',
  accent: HEL.mag,
  backdrop: art,
  backdropFx,
  stage: {
    flash: [86, 224, 255],
    onStart({ scene, fx, region }) { // reactor overload: the dome lights up and the blast doors slam
      overload.at = scene.time.now / 1000;
      scene.cameras.main.flash(420, 86, 224, 255);
      fx.shake(0.016, 900);
      for (let i = 0; i < 6; i++) scene.time.delayedCall(i * 120, () => fx.bolt(300 + i * 330, 0, 400 + i * 330, 380, i % 2 ? 0xff4fd8 : 0x56e0ff, 260));
      fx.text(region.boss ? region.boss.x - 220 : 1500, 520, t('SECURITY LOCKDOWN'), '#9ff0ff', 28, 1400);
    },
    drawBarrier(g, x, h) { // a blast door of layered shielding
      g.fillStyle(0x0a1128, 0.97).fillRect(x - 16, 0, 32, h);
      g.fillStyle(HEL.neon, 0.4).fillRect(x - 32, 0, 64, h);
      g.fillStyle(HEL.mag, 0.9);
      for (let y = 0; y < h; y += 60) g.fillRect(x - 16, y, 32, 4);
      g.lineStyle(2, 0xffffff, 0.7).lineBetween(x, 0, x, h);
    },
  },
  drawLedge(g, o) { // energy platform
    g.fillStyle(0x0a1128, 1).fillRect(o.x, o.y, o.w, 8);
    g.fillStyle(HEL.mag, 0.9).fillRect(o.x, o.y, o.w, 3);
    g.fillStyle(HEL.neon, 0.25).fillRect(o.x + 6, o.y + 8, o.w - 12, 8);
    g.fillStyle(HEL.neon, 0.9).fillRect(o.x - 2, o.y - 2, 6, 12).fillRect(o.x + o.w - 4, o.y - 2, 6, 12);
  },
  drawDecor(g, d, ctx) {
    if (d.kind === 'reactor') { // the caged core behind the boss
      g.fillStyle(0x0a1128, 1).fillRect(d.x + d.w * 0.35, d.y, d.w * 0.3, d.h).fillRect(d.x, d.y + d.h * 0.9, d.w, d.h * 0.1);
      g.fillStyle(0xffffff, 0.95).fillCircle(d.x + d.w / 2, d.y + d.h * 0.35, d.w * 0.2);
      g.lineStyle(5, HEL.hullLight, 1).strokeEllipse(d.x + d.w / 2, d.y + d.h * 0.35, d.w * 0.7, d.w * 0.26).strokeEllipse(d.x + d.w / 2, d.y + d.h * 0.35, d.w * 0.5, d.w * 0.5);
      return;
    }
    if (d.kind === 'array') {
      g.fillStyle(0x131c3a, 1).fillRect(d.x, d.y, d.w, d.h).lineStyle(2, HEL.neon, 0.7).strokeRect(d.x, d.y, d.w, d.h);
      for (let yy = d.y + 16; yy < d.y + d.h - 10; yy += 28) g.fillStyle(HEL.neon, 0.5).fillRect(d.x + 10, yy, d.w - 20, 5);
      return;
    }
    if (d.kind === 'deckglow') return;
    heliosTheme.drawDecor(g, d, ctx);
  },
  animated: {
    ...heliosTheme.animated,
    reactor: {
      layer: 'back', pad: 80,
      draw(g, d, t) { // the core breathes, and flares when the boss wakes
        const k = Math.max(0, 1 - (t - overload.at) / 1.4), p = 0.5 + 0.5 * Math.sin(t * 3);
        const cx = d.x + d.w / 2, cy = d.y + d.h * 0.35;
        g.fillStyle(HEL.neon, 0.08 + 0.08 * p + 0.2 * k).fillCircle(cx, cy, d.w * (0.5 + 0.1 * p + 0.3 * k));
        g.fillStyle(HEL.mag, 0.1 + 0.1 * k).fillCircle(cx, cy, d.w * 0.3);
        g.lineStyle(3, HEL.neon, 0.6).strokeEllipse(cx, cy, d.w * 0.7 + Math.sin(t) * 10, d.w * 0.26);
      },
    },
    deckglow: {
      layer: 'back', pad: 20,
      draw(g, d, t) { const k = Math.max(0, 1 - (t - overload.at) / 1.4); for (let i = 0; i < d.w / 100; i++) g.fillStyle(i % 2 ? HEL.mag : HEL.neon, 0.25 + 0.25 * Math.sin(t * 2 + i) + 0.4 * k).fillRect(d.x + i * 100 + 20, GROUND_Y + 12, 60, 3); },
    },
  },
  ambient(scene, region) {
    overload.at = -99;
    return heliosTheme.ambient!(scene, region);
  },
};

export function buildAegisArena(): RegionDef {
  return arenaRegion({
    id: 'aegis_arena', name: 'Reactor Dome', theme: 'arena_aegis', width: 2400, boss: 'aegis', bossX: 1850, lampId: 'dome_lamp', lampName: 'Reactor Dome Lamp',
    scale: { hp: 2.9, atk: 2.1 },
    // a zig-zag of energy pads under a high floating bridge, ringing the core
    platforms: [[760, 850, 200], [1060, 740, 160], [1360, 850, 200], [1660, 740, 160], [1960, 850, 200], [1250, 600, 260]],
    decorate(b) {
      b.add('reactor', 1000, 80, 480, 760);
      for (const x of [300, 1700, 2250]) b.add('array', x, GROUND_Y - 420, 120, 420);
      for (const x of [520, 1500, 2150]) b.add('beacon', x, GROUND_Y, 20, 170);
      for (const x of [820, 1980]) b.add('holo', x, GROUND_Y - 50, 40, 0);
      b.add('deckglow', 600, GROUND_Y, 1700, 0);
      b.add('cable', 700, 0, 70, 300, undefined, 'front'); b.add('cable', 1800, 0, 70, 360, undefined, 'front');
    },
  });
}
