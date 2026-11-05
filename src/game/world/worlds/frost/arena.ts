import type Phaser from 'phaser';
import type { RegionDef } from '@/game/config/regions';
import type { BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, hash, mulberry32, vgrad, wrapX } from '../../kit';
import { t } from '@/i18n';
import { FROST, frostTheme } from './theme';

type Ctx = CanvasRenderingContext2D;

/** The Cryo Core: a frozen reactor hall. Giant ice crystals, cryo tanks and a sheet of glassy black ice. */
const shatter = { at: -99 };

function farCavern(c: Ctx, w: number, h: number): void {
  const r = mulberry32(77);
  vgrad(c, 0, 0, w, h, [[0, '#04101f'], [1, '#0b2a46']]);
  // cavern ribs
  c.strokeStyle = 'rgba(143,232,255,0.2)'; c.lineWidth = 3;
  for (let x = 0; x < w; x += 170) { c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 60, h * 0.5, x + 20 + r() * 40, h); c.stroke(); }
  // colossal glowing crystals
  for (let x = 90; x < w; x += 300 + r() * 160) {
    const ch = 220 + r() * 220, cw = 70 + r() * 60;
    wrapX(w, x - 30, cw + 60, (ox) => {
      const gr = c.createRadialGradient(ox + cw / 2, h - ch / 2, 0, ox + cw / 2, h - ch / 2, ch * 0.9);
      gr.addColorStop(0, 'rgba(143,232,255,0.3)'); gr.addColorStop(1, 'rgba(143,232,255,0)');
      c.fillStyle = gr; c.fillRect(ox - ch, h - ch * 1.6, ch * 2 + cw, ch * 1.7);
      c.fillStyle = 'rgba(120,210,245,0.85)'; c.beginPath(); c.moveTo(ox, h); c.lineTo(ox + cw * 0.15, h - ch * 0.8); c.lineTo(ox + cw * 0.5, h - ch); c.lineTo(ox + cw * 0.85, h - ch * 0.75); c.lineTo(ox + cw, h); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(ox + cw * 0.3, h); c.lineTo(ox + cw * 0.4, h - ch * 0.7); c.lineTo(ox + cw * 0.5, h - ch); c.lineTo(ox + cw * 0.5, h); c.fill();
    });
  }
}

function midTanks(c: Ctx, w: number, h: number): void {
  const r = mulberry32(6);
  for (let x = 30; x < w; x += 360) {
    wrapX(w, x, 160, (ox) => {
      c.fillStyle = '#0a1b2c'; c.fillRect(ox, h - 300, 120, 300); c.fillRect(ox - 10, h - 310, 140, 16);
      const lv = 0.4 + r() * 0.5;
      c.fillStyle = 'rgba(120,225,255,0.55)'; c.fillRect(ox + 14, h - 290 + 280 * (1 - lv), 92, 280 * lv);
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(ox + 20, h - 290, 10, 280);
      c.fillStyle = '#ff5a5a'; c.fillRect(ox + 52, h - 330, 16, 8);
    });
  }
  vgrad(c, 0, h - 80, w, 80, [[0, 'rgba(160,220,245,0)'], [1, 'rgba(160,220,245,0.4)']]);
}

function nearPipes(c: Ctx, w: number, h: number): void {
  const r = mulberry32(2);
  c.strokeStyle = '#020a14'; c.lineWidth = 10;
  for (let x = 40; x < w; x += 330 + r() * 240) wrapX(w, x, 20, (ox) => { c.beginPath(); c.moveTo(ox, 0); c.lineTo(ox, 120 + r() * 220); c.stroke(); c.fillStyle = '#020a14'; c.fillRect(ox - 14, 0, 28, 24); });
}

const art: BackdropArt = {
  sky: [[0, '#020a16'], [0.6, '#06203a'], [1, '#0b3556']],
  far: { w: 2048, h: 540, draw: farCavern },
  mid: { w: 2048, h: 420, draw: midTanks },
  near: { w: 2048, h: 520, draw: nearPipes },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const k = Math.max(0, 1 - (f.t - shatter.at) / 1.2);
  for (let i = 0; i < 8; i++) { // glittering ice dust
    const x = ((hash(i) * f.w + f.t * (4 + i) * f.zoom) % f.w), y = (hash(i + 5) * f.h * 0.8 + f.t * 8 * f.zoom * (1 + hash(i))) % (f.h * 0.9);
    g.fillStyle(0xc9f4ff, 0.35).fillRect(x, y, 3 * f.zoom, 3 * f.zoom);
  }
  if (k > 0) g.fillStyle(0xe8fbff, 0.35 * k).fillRect(0, 0, f.w, f.h);
}

export const glaciaTheme: WorldTheme = {
  ...frostTheme,
  id: 'arena_glacia',
  accent: 0x8fe8ff,
  backdrop: art,
  backdropFx,
  stage: {
    flash: [200, 245, 255],
    onStart({ scene, fx, region }) { // the reactor hall freezes over
      shatter.at = scene.time.now / 1000;
      scene.cameras.main.flash(500, 200, 245, 255);
      fx.shake(0.012, 800);
      for (let i = 0; i < 8; i++) scene.time.delayedCall(i * 100, () => fx.debrisBurst(260 + i * 260, 240, 12));
      fx.text(region.boss ? region.boss.x - 220 : 1500, 520, t('DEEP FREEZE'), '#bfefff', 30, 1400);
    },
    drawBarrier(g, x, h) { // a wall of fresh ice
      g.fillStyle(0x6fb0d4, 0.9).fillRect(x - 16, 0, 32, h);
      g.fillStyle(0xe8fbff, 0.7);
      for (let y = 0; y < h; y += 70) g.fillTriangle(x - 16, y, x + 16, y + 20, x - 16, y + 60);
      g.fillStyle(0x8fe8ff, 0.25).fillRect(x - 36, 0, 72, h);
    },
  },
  drawLedge(g, o) { // slab of black ice with a cyan rim
    g.fillStyle(0x16415f, 1).fillRect(o.x, o.y, o.w, 14);
    g.fillStyle(0x8fe8ff, 0.9).fillRect(o.x, o.y, o.w, 3);
    g.fillStyle(0xc9f4ff, 0.3).fillRect(o.x + 8, o.y + 5, o.w * 0.4, 3);
    g.fillStyle(0x0b2a42, 1).fillTriangle(o.x + 12, o.y + 14, o.x + 40, o.y + 14, o.x + 26, o.y + 38).fillTriangle(o.x + o.w - 44, o.y + 14, o.x + o.w - 14, o.y + 14, o.x + o.w - 28, o.y + 34);
  },
  drawDecor(g, d, ctx) {
    if (d.kind === 'crystal') { // a towering ice crystal with an inner glow
      g.fillStyle(0x7fd5f2, 0.95).fillTriangle(d.x, d.y + d.h, d.x + d.w, d.y + d.h, d.x + d.w * 0.5, d.y);
      g.fillStyle(0xe8fbff, 0.55).fillTriangle(d.x + d.w * 0.25, d.y + d.h, d.x + d.w * 0.5, d.y + d.h, d.x + d.w * 0.5, d.y + 20);
      g.fillStyle(0x3f90b8, 0.9).fillTriangle(d.x + d.w * 0.5, d.y, d.x + d.w, d.y + d.h, d.x + d.w * 0.5, d.y + d.h);
      return;
    }
    if (d.kind === 'tank') {
      g.fillStyle(0x13304a, 1).fillRect(d.x, d.y, d.w, d.h).fillStyle(0x9fe9ff, 0.5).fillRect(d.x + 8, d.y + 20 + d.h * 0.25, d.w - 16, d.h * 0.7 - 28);
      g.fillStyle(0xffffff, 0.2).fillRect(d.x + 14, d.y + 10, 8, d.h - 20).lineStyle(3, FROST.steel, 1).strokeRect(d.x, d.y, d.w, d.h);
      return;
    }
    if (d.kind === 'frostfloor') return; // animated only
    frostTheme.drawDecor(g, d, ctx);
  },
  animated: {
    ...frostTheme.animated,
    frostfloor: {
      layer: 'back', pad: 20,
      draw(g, d, t) { // glassy floor sheen and frost creeping in at the boss's wake
        const k = Math.max(0, 1 - (t - shatter.at) / 1.2);
        g.fillStyle(0xc9f4ff, 0.08 + 0.05 * Math.sin(t) + 0.2 * k).fillRect(d.x, GROUND_Y + 2, d.w, 8);
        for (let i = 0; i < d.w / 120; i++) g.fillStyle(0xffffff, 0.5 + 0.4 * Math.sin(t * 2 + i)).fillRect(d.x + i * 120 + 40, GROUND_Y + 3, 18, 2);
      },
    },
    tank: {
      layer: 'back', pad: 20,
      draw(g, d, t) { for (let i = 0; i < 4; i++) { const u = (t * 0.3 + hash(d.seed + i)) % 1; g.fillStyle(0xffffff, 0.45).fillCircle(d.x + 18 + hash(d.seed + i * 3) * (d.w - 36), d.y + d.h - 10 - u * (d.h * 0.6), 3); } },
    },
  },
  ambient(scene, region) {
    shatter.at = -99;
    return frostTheme.ambient!(scene, region);
  },
};

export function buildGlaciaArena(): RegionDef {
  return arenaRegion({
    id: 'cryo_arena', name: 'Cryo Core', theme: 'arena_glacia', width: 2400, boss: 'glacia', bossX: 1850, lampId: 'cryo_arena_lamp', lampName: 'Cryo Core Lamp',
    scale: { hp: 2.3, atk: 1.8 },
    // an ascending diagonal of ice floes to a high crown, then a long drop-off ledge on the boss side
    platforms: [[720, 850, 180], [920, 750, 160], [1110, 650, 160], [1300, 550, 220], [1600, 650, 160], [1790, 770, 200], [2060, 860, 200]],
    decorate(b) {
      for (const [x, w, h] of [[900, 150, 360], [1500, 190, 440], [2100, 170, 380]]) b.add('crystal', x, GROUND_Y - h, w, h);
      for (const x of [260, 1160, 1950]) b.add('tank', x, GROUND_Y - 360, 120, 360);
      for (const x of [560, 1380, 2250]) b.add('heater', x, GROUND_Y, 36, 70);
      b.add('frostfloor', 600, GROUND_Y, 1700, 0);
      b.add('hangice', 400, 0, 500, 220, undefined, 'front'); b.add('hangice', 1500, 0, 600, 260, undefined, 'front');
      b.add('spikes', 60, GROUND_Y, 180, 70);
    },
  });
}
