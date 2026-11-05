import type Phaser from 'phaser';
import type { RegionDef } from '@/game/config/regions';
import type { BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, hash, mulberry32, vgrad, wrapX } from '../../kit';
import { t } from '@/i18n';
import { HOL, hollowTheme } from './theme';

type Ctx = CanvasRenderingContext2D;

/** The Moonlit Keep: a cathedral-like throne hall with a great rose window, chandeliers and a blood-red carpet. */
const eclipse = { at: -99 };

function farWindow(c: Ctx, w: number, h: number): void {
  const r = mulberry32(31);
  vgrad(c, 0, 0, w, h, [[0, '#0a0412'], [1, '#1b0d2c']]);
  for (let x = 160; x < w; x += 680) {
    wrapX(w, x - 180, 420, (ox) => {
      const cx = ox + 180, cy = h - 330;
      c.fillStyle = '#0a0412'; c.fillRect(ox, cy - 60, 360, 420); c.beginPath(); c.arc(cx, cy - 60, 180, Math.PI, 0); c.fill();
      const g = c.createRadialGradient(cx, cy, 10, cx, cy, 190);
      g.addColorStop(0, 'rgba(255,200,230,0.9)'); g.addColorStop(0.5, 'rgba(176,23,58,0.7)'); g.addColorStop(1, 'rgba(70,20,120,0.5)');
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 150, 0, 7); c.fill();
      c.strokeStyle = '#0a0412'; c.lineWidth = 8;
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150); c.stroke(); }
      c.beginPath(); c.arc(cx, cy, 80, 0, 7); c.stroke();
      const beam = c.createLinearGradient(cx, cy, cx, h); beam.addColorStop(0, 'rgba(255,170,210,0.18)'); beam.addColorStop(1, 'rgba(255,170,210,0)');
      c.fillStyle = beam; c.beginPath(); c.moveTo(cx - 120, cy + 90); c.lineTo(cx + 120, cy + 90); c.lineTo(cx + 280, h); c.lineTo(cx - 280, h); c.fill();
    });
  }
  c.strokeStyle = 'rgba(176,108,255,0.22)'; c.lineWidth = 3;
  for (let x = 0; x < w; x += 140) { c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 50, h * 0.45, x + 12 + r() * 16, h); c.stroke(); }
}

function midColumns(c: Ctx, w: number, h: number): void {
  for (let x = 30; x < w; x += 300) {
    wrapX(w, x, 100, (ox) => {
      c.fillStyle = '#0d0716'; c.fillRect(ox, 0, 72, h); c.fillRect(ox - 12, 0, 96, 30); c.fillRect(ox - 12, h - 30, 96, 30);
      c.fillStyle = 'rgba(176,108,255,0.3)'; for (let y = 50; y < h - 50; y += 60) c.fillRect(ox + 28, y, 16, 30);
    });
  }
  vgrad(c, 0, h - 90, w, 90, [[0, 'rgba(110,40,100,0)'], [1, 'rgba(110,40,100,0.5)']]);
}

function nearChains(c: Ctx, w: number, h: number): void {
  const r = mulberry32(8);
  c.strokeStyle = '#020108'; c.lineWidth = 6;
  for (let x = 50; x < w; x += 260 + r() * 260) wrapX(w, x, 20, (ox) => { const ln = 120 + r() * 320; c.beginPath(); c.moveTo(ox, 0); c.lineTo(ox, ln); c.stroke(); c.fillStyle = '#020108'; c.beginPath(); c.arc(ox, ln + 10, 12, 0, 7); c.fill(); });
}

const art: BackdropArt = {
  sky: [[0, '#06020e'], [0.6, '#12081f'], [1, '#210f33']],
  far: { w: 2048, h: 580, draw: farWindow },
  mid: { w: 2048, h: 420, draw: midColumns },
  near: { w: 2048, h: 540, draw: nearChains },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const k = Math.max(0, 1 - (f.t - eclipse.at) / 1.4);
  for (let i = 0; i < 5; i++) { // dust turning in the window-light
    const x = ((hash(i + 3) * f.w + f.t * (5 + i * 2) * f.zoom) % f.w), y = f.h * (0.2 + 0.5 * hash(i)) + Math.sin(f.t * 0.6 + i) * 20 * f.zoom;
    g.fillStyle(0xffc0e0, 0.25).fillCircle(x, y, 2 * f.zoom);
  }
  if (k > 0) g.fillStyle(0xb0173a, 0.18 * k).fillRect(0, 0, f.w, f.h);
}

export const mordaineTheme: WorldTheme = {
  ...hollowTheme,
  id: 'arena_mordaine',
  accent: HOL.blood,
  backdrop: art,
  backdropFx,
  stage: {
    flash: [176, 23, 58],
    onStart({ scene, fx, region }) { // the great window turns blood-red, bats burst from the rafters
      eclipse.at = scene.time.now / 1000;
      scene.cameras.main.flash(420, 176, 23, 58);
      fx.shake(0.012, 800);
      for (let i = 0; i < 8; i++) scene.time.delayedCall(i * 90, () => fx.hitSparks(260 + i * 270, 160, 1, 10, true));
      fx.text(region.boss ? region.boss.x - 220 : 1500, 520, t('BLOOD MOON'), '#ff5a7a', 30, 1400);
    },
    drawBarrier(g, x, h) { // a curtain of thorned blood-glass
      g.fillStyle(0x1b0710, 0.96).fillRect(x - 16, 0, 32, h);
      g.fillStyle(HOL.blood, 0.45).fillRect(x - 32, 0, 64, h);
      g.fillStyle(0xff5a7a, 0.9);
      for (let y = 0; y < h; y += 52) g.fillTriangle(x - 16, y, x + 16, y + 14, x - 16, y + 30);
    },
  },
  drawLedge(g, o) { // carved oak balcony with a wrought-iron rail
    g.fillStyle(0x2a1426, 1).fillRect(o.x, o.y, o.w, 12);
    g.fillStyle(0x6a3a4a, 1).fillRect(o.x, o.y, o.w, 3);
    g.fillStyle(0x0d0a14, 1);
    for (let xx = o.x + 6; xx < o.x + o.w - 4; xx += 18) g.fillRect(xx, o.y - 16, 3, 16);
    g.fillRect(o.x, o.y - 17, o.w, 3);
    g.fillStyle(0x1a0c18, 1).fillTriangle(o.x + 8, o.y + 12, o.x + 36, o.y + 12, o.x + 8, o.y + 34).fillTriangle(o.x + o.w - 36, o.y + 12, o.x + o.w - 8, o.y + 12, o.x + o.w - 8, o.y + 34);
  },
  drawDecor(g, d, ctx) {
    if (d.kind === 'throne') {
      g.fillStyle(0x1a0c18, 1).fillRect(d.x, d.y + d.h * 0.5, d.w, d.h * 0.5).fillRect(d.x + d.w * 0.2, d.y, d.w * 0.6, d.h * 0.6);
      g.fillStyle(HOL.blood, 1).fillRect(d.x + d.w * 0.28, d.y + 20, d.w * 0.44, d.h * 0.55).fillStyle(0x6a5a3a, 1).fillTriangle(d.x + d.w * 0.2, d.y, d.x + d.w * 0.8, d.y, d.x + d.w * 0.5, d.y - 70);
      return;
    }
    if (d.kind === 'chandelier') {
      g.lineStyle(3, 0x0d0a14, 1).lineBetween(d.x, 0, d.x, d.y);
      g.fillStyle(0x6a5a3a, 1).fillRect(d.x - d.w / 2, d.y, d.w, 8).fillRect(d.x - 4, d.y - 20, 8, 28);
      for (let i = 0; i < 5; i++) g.fillRect(d.x - d.w / 2 + 6 + i * ((d.w - 12) / 4) - 2, d.y - 10, 4, 12);
      return;
    }
    if (d.kind === 'carpet') { g.fillStyle(HOL.blood, 0.9).fillRect(d.x, GROUND_Y - 2, d.w, 8); g.fillStyle(0x6a5a3a, 1).fillRect(d.x, GROUND_Y - 2, d.w, 2).fillRect(d.x, GROUND_Y + 4, d.w, 2); return; }
    if (d.kind === 'pillar') {
      g.fillStyle(0x2a2636, 1).fillRect(d.x, d.y, d.w, d.h).fillRect(d.x - 10, d.y - 14, d.w + 20, 16).fillRect(d.x - 10, d.y + d.h - 12, d.w + 20, 14);
      g.lineStyle(2, 0x07030f, 0.4); for (let x = d.x + 8; x < d.x + d.w; x += 12) g.lineBetween(x, d.y, x, d.y + d.h);
      return;
    }
    hollowTheme.drawDecor(g, d, ctx);
  },
  animated: {
    ...hollowTheme.animated,
    chandelier: {
      layer: 'back', pad: 120,
      draw(g, d, t) { for (let i = 0; i < 5; i++) { const x = d.x - d.w / 2 + 6 + i * ((d.w - 12) / 4), k = 0.7 + 0.3 * Math.sin(t * 10 + i * 1.7 + d.seed); g.fillStyle(0xffd27a, 0.14 * k).fillCircle(x, d.y - 12, 42); g.fillStyle(0xffe6a8, 0.95).fillTriangle(x - 3, d.y - 4, x + 3, d.y - 4, x, d.y - 22 * k); } },
    },
    throne: {
      layer: 'back', pad: 60,
      draw(g, d, t) { const k = Math.max(0, 1 - (t - eclipse.at) / 1.4); g.fillStyle(HOL.blood, 0.1 + 0.1 * Math.sin(t * 2) + 0.25 * k).fillCircle(d.x + d.w / 2, d.y + d.h * 0.3, 120); },
    },
  },
  ambient(scene, region) {
    eclipse.at = -99;
    return hollowTheme.ambient!(scene, region);
  },
};

export function buildMordaineArena(): RegionDef {
  return arenaRegion({
    id: 'mordaine_arena', name: 'Moonlit Keep', theme: 'arena_mordaine', width: 2500, boss: 'mordaine', bossX: 1900, lampId: 'keep_lamp', lampName: 'Moonlit Keep Lamp',
    scale: { hp: 3.2, atk: 2.3 },
    // twin balconies reached by spiral stairs on each side; the floor between them is wide open ground
    platforms: [[700, 830, 160], [880, 720, 160], [1050, 610, 200], [1700, 610, 200], [1930, 720, 160], [2120, 830, 160]],
    decorate(b) {
      b.add('throne', 2000, GROUND_Y - 230, 300, 230);
      for (const x of [240, 1240, 1500, 2350]) b.add('pillar', x, 120, 70, GROUND_Y - 120);
      for (const x of [800, 1380, 1960]) b.add('chandelier', x, 240, 160, 0);
      for (const x of [560, 1180, 1620, 2240]) b.add('candelabra', x, GROUND_Y, 20, 100);
      b.add('carpet', 600, GROUND_Y, 1800, 0);
      b.add('coffin', 900, GROUND_Y - 70, 60, 70); b.add('coffin', 1450, GROUND_Y - 70, 60, 70);
      b.add('thorns', 700, 0, 80, 300, undefined, 'front'); b.add('thorns', 2000, 0, 80, 360, undefined, 'front');
    },
  });
}
